/**
 * Constants
 */
const { EVENT_SOCKET_CONSTANT_SUBJECT_PCM }		= require('./helper/subject_pcm.events-socket-constant');
// const { CF_DOMAIN_SERVICES } 					= require('../gateway/helper/domain.constant');
// const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');
// const { CF_ACTIONS_MEDIA }						= require('../media/helper/media.actions-constant');
// const { CF_ACTIONS_ITEM }						= require('../item/helper/item.actions-constant');
// const { APP_KEYS } 								= require('../../tools/keys');
// const { ENV_DEVICE_WEB_CBS } 					= require('../notification/helper/notification.keys-constant')

/**
 * Utils
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');
const PCM_PLAN_TASK_COLL                		= require('./database/subject_pcm.pcm_plan_task-coll');

exports.SUBJECT_SOCKET = {

    [EVENT_SOCKET_CONSTANT_SUBJECT_PCM.SUBJECT_PCM_CSS_ADD_CHECKLIST]: async function(data) { 
        try {
			let socket                     		= this;
			let listUserActive             		= socket.$service.listUserConnected;
			let userID             				= socket.$service.userID;
			let io                         		= socket.$service.io;

			let { taskID, checklistID } 		= data;

			if(!taskID || !checklistID){
				return sendDataToMultilSocketsOfListUser({ 
					listUserConnected: listUserActive,
					arrReceiver: [userID],
					data: { error: true, message: "Tham số taskID hoặc checklistID không hợp lệ" }, 
					event: [EVENT_SOCKET_CONSTANT_SUBJECT_PCM.SUBJECT_PCM_SSC_ADD_CHECKLIST], io
				});
			}

			const infoTask = await PCM_PLAN_TASK_COLL.findById(taskID).lean();

			const infoCheckList = await PCM_PLAN_TASK_COLL
				.findById(checklistID)
				.populate('assignee', '_id bizfullname')
				.lean();

			if(!infoCheckList || !infoTask) {
				return sendDataToMultilSocketsOfListUser({ 
					listUserConnected: listUserActive,
					arrReceiver: [userID],
					data: { error: true, message: "Task hoặc Checklist không tồn tại" }, 
					event: [EVENT_SOCKET_CONSTANT_SUBJECT_PCM.SUBJECT_PCM_SSC_ADD_CHECKLIST], io
				});
			}

			let { author, assignee, related } = infoTask;
			related = related.map(userID => userID.toString());

			const listReceivers = [...new Set([author.toString(), assignee.toString(), ...related])];
			const receivers = listReceivers.filter(receiverID => receiverID !== userID.toString());

			// SEND SOCKET
			sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: receivers,
				data: {
					error: false,
					data: {
						infoTask,
						infoCheckList
					}
				}, event: [EVENT_SOCKET_CONSTANT_SUBJECT_PCM.SUBJECT_PCM_SSC_ADD_CHECKLIST], io
			});
		} catch (error) {
			console.info('======EVENT_SOCKET_CONSTANT_SUBJECT_PCM.SUBJECT_PCM_CSS_ADD_CHECKLIST=====');
			console.error(error);
		}
	},

}