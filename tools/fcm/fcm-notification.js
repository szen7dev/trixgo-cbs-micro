let FCM         = require('fcm-notification');
let TRIXGO_MICRO      = require('./trixgo-micro-firebase-adminsdk-9jrv0-d9279d1930.json')

let fcm         			  = new FCM(TRIXGO_MICRO)

exports.sendMessageSpecialDevice = function (message, registrationId, callback) {
	// let message = new gcm.Message({data: {message: message}});
	// let regTokens = [registrationId];
	// let sender = new gcm.Sender(constants.gcm_api_key, TRIXGO);

	let obj = {
		data: {   
			score: '850',
			time: '2:45'
		},
		notification: {
			title: 'hello',
			body: message,
			// icon: '/template/trixgo_core/images/favicon.ico'
		},
		token: registrationId
	};

	fcm.send(obj, function (err, response) {
		if (err) {
			console.error(err);
			callback({
                error : true,
                message : 'unable_to_send_message'
            });

		} else {
			// console.log(response);
			callback({
                error: false,
                message: 'message_successfully_sent'
            });
		}
	});

}

exports.sendMessageMultilDevices = function (message, registrationIds, callback) {
	let obj = {
		data: {   
			score: '850',
			time: '2:45'
		},
		notification: {
			title: 'hello',
			body: message
		},
		token: [...registrationIds]
	};

	fcm.send(obj, function (err, response) {
		if (err) {
			console.error(err);
			callback({
                error : true,
                message : 'unable_to_send_message'
            });

		} else {
			// console.log(response);
			callback({
                error: false,
                message: 'message_successfully_sent'
            });
		}
	});
}

// demo đã test
exports.sendMessage = function (message, registrationId, body) {
	return new Promise(resolve => {
		
		// var message = new gcm.Message({data: {message: message}});
		// var regTokens = [registrationId];
		// var sender = new gcm.Sender(constants.gcm_api_key, TRIXGO);
		let tokens = Array.isArray(registrationId) ? registrationId : [registrationId]
	
		let row = JSON.stringify(body)
	
		// console.log(row)
		let title = body.title;
		if(!title){
			title = 'TrixGo'
		}
		var mapMessage = {
		data: {    //This is only optional, you can send any data
			row: row
		},
		notification: {
			title,
			body: message
		},
		};
	
		fcm.sendToMultipleToken(mapMessage, tokens, function (err, response) {
		if (err) {
			// console.error(err);
			// callback(constants.error.msg_send_failure);
			return ({
				error : true,
				message : 'unable_to_send_message'
			});
		} else {
			// console.log(response);
			/**
			 * response payload: cần lưu lại DB //TODO
			 * [
				{
					token: 'cjr_8pxBDlY:APA91bGULJFkgDPaTDF2f7XXsFDp-WtJyPS32i4V4JfPp9zU43Z-lY0_lI7DMWU-0HcUWvfGVhq8CsC8JBQnx44Cn5XttJ9J9NgE8g0RBKuLGackOuaUXqK1eVCI6Sqe3MTU6DMtZwSh',
					response: 'Successfully sent message:projects/trixgo-7e221/messages/0:1606491813281863%4abbcae24abbcae2'
				},
				{
					token: 'cS-J6TJCT5SW7wFDr8hOG_:APA91bF4sRUZ58Rg0JpUfbOXvxvzlQtkwPx2bHrvllsCVRt50exVXhDpqkjeHlKoP_JZt0NyCPPv0SKVGraG3tUVl8phUtMpewqN33wfegA3hqkB2U0rxdGu0M0Uqq42Li7M_soph_xh',
					response: 'Error sending message:'
				}
				]
				[
				{
					token: 'dtaNyGlUSkWoCEdR-0rj37:APA91bG8ZWd7jDGzqr7NEJJE_JrCBH5aDyZSk3YiAQtypbgb51Z_0tjEWGIZxlzBUfUETl5aItH9fmz4y2kU8UDkcXaEsrdFKQ_WGrRYNkIwV8s1LPA72jWCTgZO0UOxkY_vFb6M0zyJ',
					response: 'Error sending message:'
				},
				{
					token: 'e3va1Gj8sUiSoKqF21_z_s:APA91bGuQNlL9l2N3BNVz1VM-Yrs6bLLpn5XKHlHKAzMqLiry4kYxxikWdGXVvIPgdbvvqyiQWmGAUWRhsOKwVyqudS-uiKu6TdZyp7oFc05hCCnDfROSnw5_xMT5AQiP8-bt819xNCL',
					response: 'Error sending message:'
				}
				]
			*/
			// callback(constants.success.msg_send_success);
			return resolve({
				error: false,
				message: 'message_successfully_sent'
			});
		}
		});
	
	})
}