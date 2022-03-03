/**
 * Constants
 */
const { EVENT_SOCKET_CONSTANT_COMMENT }    		= require('./helper/reaction.events-socket-constant');
const { CF_DOMAIN_SERVICES } 					= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');
const { CF_ACTIONS_SUBJECT_PCM }				= require('../subject_pcm/helper/subject_pcm.actions-constant');
const { CF_ACTIONS_MEDIA }						= require('../media/helper/media.actions-constant');
const { APP_KEYS } 								= require('../../tools/keys');

/**
 * Utils
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');

exports.REACTION_SOCKET = {

    [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_CSS_ADD_COMMENT]: async function(data) { 
        let socket                     		= this;
		let broker							= socket.$service.broker;
        let listUserActive             		= socket.$service.listUserConnected;
        let userID                     		= socket.client.user;
        let io                         		= socket.$service.io;

		let { objectID, infoComment, parentID, select, populates, app } = data;

		if(!infoComment || !app){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive,
				arrReceiver: [userID],
				data: { error: true, message: "Tham số comment ID hoặc app không hợp lệ" }, 
				event: [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_SSC_ADD_COMMENT], io
			});
		}

		let descriptionMSS = '';
		let webUrl = '';
		let infoObject = null;
		let arrReceiver = [];

		switch (app) {
			case APP_KEYS.PCM_PLAN_TASK: {
				// infoComment = await broker.call(`${CF_DOMAIN_SERVICES.SUBJECT_PCM}.${CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_GET_INFO_AND_GET_LIST}`, {
				// 	commentTemplateID: commentID, select, populates
				// });

				infoObject = await broker.call(`${CF_DOMAIN_SERVICES.SUBJECT_PCM}.${CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST}`, {
					taskID: objectID, select, populates
				}, {
					meta: {
						infoUser: { _id: userID }
					}
				});

				if(!infoObject.error) {
					const { author, assignee, related } = infoObject.data;
					arrReceiver = [...new Set([author, assignee, ...related])];
				}

				descriptionMSS = `${infoComment?.userCreate?.bizfullname} đã tạo 1 phản hồi`;
				webUrl = `https://staging.cbs.trixgo.com/pcm/detail/${infoObject?.data?._id}`;
				break;
			}
			case APP_KEYS.MEDIA: {
				infoObject = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.INFO_MEDIA}`, {
					mediaID: objectID, select, populates
				}, {
					meta: {
						infoUser: { _id: userID }
					}
				});

				const listUserReceive = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
					companyID: infoObject?.data?.company
				}, {
					meta: {
						infoUser: { _id: userID }
					}
				});

				if(!listUserReceive.error) {
					arrReceiver = listUserReceive.data.map(user => user._id);
				}

				// const listComments = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.GET_INFO_AND_GET_LIST_COMMENT_MEDIA}`, {
				// 	mediaID: objectID, isLoadAll: true
				// }, {
				// 	meta: {
				// 		infoUser: { _id: userID }
				// 	}
				// });

				// if(!listComments.error) {
				// 	const listReceiver = listComments.data.map(comment => comment.author);
				// 	arrReceiver = [...new Set(listReceiver)];
				// }

				descriptionMSS = `${infoComment?.userCreate?.bizfullname} đã tạo 1 bình luận`;
				webUrl = `https://staging.cbs.trixgo.com/media/post/${infoObject?.data?._id}`;
				break;
			}
			default:
				break;
		}

		// if(!arrReceiver.length) {
		// 	return sendDataToMultilSocketsOfListUser({ 
		// 		listUserConnected: listUserActive,
		// 		arrReceiver: [userID],
		// 		data: { error: true, message: "Người nhận không hợp lệ" }, 
		// 		event: [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_SSC_ADD_COMMENT], io
		// 	});
		// }

		// arrReceiver = arrReceiver.filter(receiverID => receiverID.toString() !== userID.toString());

		// SEND SOCKET
		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoObject: infoObject.data,
					infoComment,
					app
				}
			}, event: [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_SSC_ADD_COMMENT], io
		});

		// SEND CLOUD-MSG
		broker.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", { 
			users: arrReceiver,
			title: 'THÔNG BÁO',
			description: descriptionMSS,
			web_url: webUrl
		});
	},

}