/**
 * Constants
 */
const { EVENT_SOCKET_CONSTANT_COMMENT }    		= require('./helper/reaction.events-socket-constant');
const { CF_DOMAIN_SERVICES } 					= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');
const { CF_ACTIONS_SUBJECT_PCM }				= require('../subject_pcm/helper/subject_pcm.actions-constant');
const { CF_ACTIONS_MEDIA }						= require('../media/helper/media.actions-constant');
const { CF_ACTIONS_ITEM }						= require('../item/helper/item.actions-constant');
const { APP_KEYS } 								= require('../../tools/keys');
const { ENV_DEVICE_WEB_CBS } 					= require('../notification/helper/notification.keys-constant');

/**
 * Utils
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');

exports.REACTION_SOCKET = {

    [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_CSS_ADD_COMMENT]: async function(data) { 
        try {
			let socket                     		= this;
			let broker							= socket.$service.broker;
			let listUserActive             		= socket.$service.listUserConnected;
			let bizfullname             		= socket.$service.bizfullname;
			let userID             				= socket.client.user;
			let io                         		= socket.$service.io;

			let { objectID, infoComment, parentID, method, select, populates, app } = data;

			if(!infoComment || !app){
				return sendDataToMultilSocketsOfListUser({ 
					listUserConnected: listUserActive,
					arrReceiver: [userID],
					data: { error: true, message: "Tham số infoComment hoặc app không hợp lệ" }, 
					event: [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_SSC_ADD_COMMENT], io
				});
			}

			let titleMSS = 'THÔNG BÁO';
			let descriptionMSS = '';
			let webUrl = '';
			let infoObject = null;
			let arrReceiver = [];
			let meta = {
				infoUser: { _id: userID }
			}

			switch (app) {
				case APP_KEYS.PCM_PLAN_TASK: {
					infoObject = await broker.call(`${CF_DOMAIN_SERVICES.SUBJECT_PCM}.${CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST}`, {
						taskID: objectID, select, populates
					}, { meta });

					if(infoObject.error) break;

					let { author, assignee, related } = infoObject.data;
					related = related.map(userID => userID.toString());

					switch (infoComment.type) {
						case 1:
							descriptionMSS = `${bizfullname} đã tạo 1 bình luận`;
							break;
						case 2:
							descriptionMSS = `${bizfullname} đã tạo 1 phản hồi liên quan`;
							break;
						case 3:
							descriptionMSS = `${bizfullname} đã tạo 1 hiện trạng`;
							break;
						case 4:
							descriptionMSS = `${bizfullname} đã tạo 1 giải pháp`;
							break
						default:
							break;
					}

					arrReceiver 		= [...new Set([author.toString(), assignee.toString(), ...related])];
					infoObject 			= infoObject.data;
					titleMSS			= `CÔNG VIỆC: ${infoObject.name?.length > 100 ? infoObject.name?.substring(0, 100) : infoObject.name}`;
					webUrl 				= `${process.env.DOMAIN || 'https://staging.cbs.trixgo.com'}/pcm/detail/${infoObject?.data?._id}`;
					break;
				}
				case APP_KEYS.MEDIA: {
					infoObject = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.INFO_MEDIA}`, {
						mediaID: objectID, select, populates
					}, { meta });

					if(infoObject.error) break;

					const { company, department, type } = infoObject.data;
					console.log({ company, department, type })

					/**
					 * Loại bài viết
					 * 1: Bài viết công ty (Thành viên trong công ty)
					 * 2: Dự án, phòng ban
					 * 3: Chuyển đổi số
					 * 4: Hệ thống
					 * 5: Bài viết cá nhân
					 * ..... Sau bổ sung thêm vài loại bài viết
					 */
					switch (type) {
						case 1: {
							const listReceivers = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
								companyID: company?.toString(),
								isLoadAll: true
							}, { meta });

							if(!listReceivers.error) {
								arrReceiver = listReceivers.data?.map(user => user._id);
							}
							break;
						}
						case 2: {
							const listReceivers = await broker.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
								companyID: company?.toString(),
								departmentID: department?.toString(),
								select: "members"
							}, { meta });

							if(!listReceivers.error) {
								arrReceiver = listReceivers.data?.members;
							}
							break;
						}
						case 3:
						case 4: {
							const listReceivers = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
								isLoadAll: true
							}, { meta });

							if(!listReceivers.error) {
								arrReceiver = listReceivers.data?.map(user => user._id);
							}
							break;
						}
						default:
							break;
					}

					infoObject 			= infoObject.data;
					titleMSS 			= `BÀI VIẾT: ${infoObject.title?.length > 100 ? infoObject.title.substring(0, 100) : infoObject.title}`;
					descriptionMSS 		= `${bizfullname} đã tạo 1 bình luận`;
					webUrl 				= `${process.env.DOMAIN || 'https://staging.cbs.trixgo.com'}/media/post/${infoObject?._id}`;
					break;
				}
				default:
					break;
			}
			console.log({ LENGTH: arrReceiver.length })

			if(!arrReceiver.length) {
				return sendDataToMultilSocketsOfListUser({ 
					listUserConnected: listUserActive,
					arrReceiver: [userID],
					data: { error: true, data: arrReceiver, message: "Người nhận không hợp lệ" }, 
					event: [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_SSC_ADD_COMMENT], io
				});
			}
			arrReceiver = arrReceiver.map(receiverID => receiverID.toString());

			// SEND SOCKET
			sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver,
				data: {
					error: false,
					data: {
						method,
						parentID,
						infoObject,
						infoComment,
						app
					}
				}, event: [EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_SSC_ADD_COMMENT], io
			});

			// arrReceiver = arrReceiver.filter(receiverID => receiverID !== userID.toString());
			console.log({ arrReceiver, userID })

			// SEND CLOUD-MSG
			broker.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", { 
				users: [...arrReceiver, userID],
				title: titleMSS,
				description: descriptionMSS,
				dataSend: {
					infoObject,
					infoComment
				},
				web_url: webUrl,
				env: ENV_DEVICE_WEB_CBS
			});
		} catch (error) {
			console.info('======EVENT_SOCKET_CONSTANT_COMMENT.COMMENT_CSS_ADD_COMMENT=====');
			console.error(error);
		}
	},

}