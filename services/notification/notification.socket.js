/**
 * CONSTANTS
 */
const { EVENT_SOCKET_CONSTANT_NOTIFICATION }    = require('./helper/notification.events-socket-constant');
const { CF_DOMAIN_SERVICES } 					= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');
 
/**
 * TOOLS
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');

/**
 * COLLECTIONS
 */
const NOTIFICATION_COLL 				        = require('./database/notification.log-coll');

/**
 * MODELS
 */
const NOTIFICATION_MODEL 					    = require('./model/notification.log-model').MODEL;


exports.CHATTING_SOCKET = {
 
    [EVENT_SOCKET_CONSTANT_NOTIFICATION.NOTIFICATION_CSS_ADD_MEDIA]: async function(data, ack) { 
        let socket                      = this;
        let listUserActive              = socket.$service.listUserConnected2;
        let userID                      = socket.client.user;
        let io                          = socket.$service.io;

		// if(!infoConversation){
		// 	return sendDataToMultilSocketsOfListUser({ 
		// 		listUserConnected: listUserActive, 
		// 		arrReceiver: [userID],
		// 		data: { error: true, message: "Can't get info conversation" }, 
		// 		event: [EVENT_SOCKET_CONSTANT_NOTIFICATION.NOTIFICATION_SSC_ADD_MEDIA], io
		// 	});
		// }

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver: [],
			data: {
				error: false,
				data: {
                    
				}
			}, event: [EVENT_SOCKET_CONSTANT_NOTIFICATION.NOTIFICATION_SSC_ADD_MEDIA], io
		});
     },
}