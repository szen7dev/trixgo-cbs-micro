/**
 * CONSTANTS
 */
const { EVENT_SOCKET_CONSTANT_MEDIA } 			= require('./helper/media.events-socket-constant');
const { CF_DOMAIN_SERVICES } 					= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');
const { CF_ACTIONS_MEDIA } 						= require('../media/helper/media.actions-constant');

/**
 * TOOLS
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');

/**
 * COLLECTIONS
 */
const MEDIA_COLL					        	= require('./database/media-coll');

exports.MEDIA_SOCKET = {

    'CLIENT_SEND_MEDIA_TEST': async function(data, ack) { 
        let socket                      = this;
        let userID                      = socket.client.user;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
			
		console.log({userID, listUserActive})
        sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver: [userID], 
			data: {
				message: "Hi Client!! I'm server...",
				userID,
				listUserActive
			}, 
			event: 'SERVER_SEND_MEDIA_TEST', io
		})
    },

    // =============================== MEDIA ==================================

	/**
	 * Dev: NPNguyen 🐸
	 * Func: TẠO BÀI VIẾT VỚI TẤT CẢ BẠN BÈ
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_NEW_FOR_ALL_FRIENDS]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID } 					= data;
		let arrReceiver						= [];
		const infoMedia = await MEDIA_COLL.findById(mediaID);

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_NEW_FOR_ALL_FRIENDS], io
			});
		}

		const infoSenderCall = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image friends'
		});
		const infoSender = infoSenderCall?.data

		if(infoSender?.friends) {
			arrReceiver = infoSender?.friends
		}

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoSender: infoSender,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_NEW_FOR_ALL_FRIENDS], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: TẠO BÀI VIẾT VỚI TẤT CẢ BẠN BÈ TRONG CÔNG TY
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_NEW_FOR_FIREND_IN_COMPANY]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID, companyID } 			= data;
		let arrReceiver						= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_NEW_FOR_FIREND_IN_COMPANY], io
			});
		}

		const infoSenderCall = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_USER_WITH_CONDITION}`, {
			condition: { _id: { $in: userID }, company: `${companyID}` },
			select: '_id bizname fullname image friends'
		});
		const infoSender = infoSenderCall?.data[0]

		if(infoSender?.friends) {
			arrReceiver = infoSender?.friends
		}

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoSender: infoSender,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_NEW_FOR_FIREND_IN_COMPANY], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: TAG TÊN BẠN BÈ
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_TAG_FRIEND]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID, friendsID } 			= data;
		const infoMedia = await MEDIA_COLL.findById(mediaID);

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_TAG_FRIEND], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const tagFriends = infoMedia?.tagFriends;

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver: tagFriends,
			data: {
				error: false,
				data: {
					infoMedia,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_TAG_FRIEND], io
		});

    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: REACTION BÀI VIẾT
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_REACTION]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID } 					= data;
		let arrReceiver						= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REACTION], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const infoAuthorMedia = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: `${infoMedia?.author}`,
			select: '_id bizname fullname image'
		});

		// Nếu người đăng bài viết tự reaction thì không gửi socket
		if(userID != infoAuthorMedia?.data?._id) {
			arrReceiver = [ infoAuthorMedia?.data?._id ]
		}

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoSender: infoSender.data,
					infoAuthorMedia: infoAuthorMedia.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REACTION], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: REACTION ẢNH TRONG BÀI VIẾT
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_REACTION_IMAGE]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID, imageID } 		    = data;
		let arrReceiver						= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REACTION_IMAGE], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const infoAuthorMedia = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: `${infoMedia?.author}`,
			select: '_id bizname fullname image'
		});

		// Nếu người đăng bài viết tự reaction thì không gửi socket
		if(userID != infoAuthorMedia?.data?._id) {
			arrReceiver = [ infoAuthorMedia?.data?._id ]
		}

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					idImageReaction: imageID,
					infoSender: infoSender.data,
					infoAuthorMedia: infoAuthorMedia.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REACTION_IMAGE], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: REACTION COMMENT TRONG BÀI VIẾT
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_REACTION_COMMENT]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID, commentID } 			= data;
		let arrReceiver						= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		const infoCommentCall = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.GET_DETAIL_COMMENT_MEDIA}`, {
			commentID: `${commentID}`,
		});
		const infoComment = infoCommentCall?.data?.infoComent;

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REACTION_COMMENT], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const infoAuthorMedia = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: `${infoMedia?.author}`,
			select: '_id bizname fullname image'
		});

		// Nếu người reaction là người viết comment thì sẽ không gửi socket
		if( userID != infoComment?.author?._id) {
			arrReceiver = [infoComment?.author?._id]
		}
		
		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoComment,
					infoSender: infoSender.data,
					infoAuthorMedia: infoAuthorMedia.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REACTION_COMMENT], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: REPLY COMMENT TRONG BÀI VIẾT
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_REPLY_COMMENT]: async function(data, ack) { 
        let socket                      			= this;
		let broker                      			= socket.$service.broker;
        let listUserActive              			= socket.$service.listUserConnected2;
        let io                          			= socket.$service.io;
        let userID                      			= socket.client.user;
        let { mediaID, commentID, replyCommentID } 	= data;
		let arrReceiver								= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		const infoCommentCall = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.GET_DETAIL_COMMENT_MEDIA}`, {
			commentID: `${commentID}`,
		});
		const infoComment = infoCommentCall?.data?.infoComent;

		const infoCommentReplyCall = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.GET_DETAIL_COMMENT_MEDIA}`, {
			commentID: `${replyCommentID}`,
		});
		const infoCommentReply = infoCommentReplyCall?.data?.infoComent;

		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REPLY_COMMENT], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const infoAuthorMedia = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: `${infoMedia?.author}`,
			select: '_id bizname fullname image'
		});

		// Nếu người reply comment là người viết comment thì sẽ không gửi socket
		if( userID != infoComment?.author?._id) {
			arrReceiver = [ ...arrReceiver, infoComment?.author?._id ]
		} else if ( userID != infoMedia?.author) { // Nếu người reply comment là người viết tạo media thì không gửi socket
			arrReceiver = [ ...arrReceiver, infoMedia?.author ]
		} 
		
		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoComment,
					infoCommentReply,
					infoSender: infoSender.data,
					infoAuthorMedia: infoAuthorMedia.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_REPLY_COMMENT], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: COMMENT TRONG BÀI VIẾT
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_COMMENT]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID, commentID } 			= data;
		let arrReceiver						= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		const infoCommentCall = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.GET_DETAIL_COMMENT_MEDIA}`, {
			commentID: `${commentID}`,
		});
		const infoComment = infoCommentCall?.data?.infoComent;
		
		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_COMMENT], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const infoAuthorMedia = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: `${infoMedia?.author}`,
			select: '_id bizname fullname image'
		});

		// Nếu người viết comment là người tạo bài viết thì sẽ không gửi socket
		if( userID != infoMedia?.author) {
			arrReceiver = [infoMedia?.author]
		}
		
		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoComment,
					infoSender: infoSender.data,
					infoAuthorMedia: infoAuthorMedia.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_COMMENT], io
		});
    },

	/**
	 * Dev: NPNguyen 🐸
	 * Func: COMMENT ẢNH TRONG BÀI VIẾT
	*/
    [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_CSS_COMMENT_IMAGE]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { mediaID, commentID, imageID } = data;
		let arrReceiver						= [];

		const infoMedia = await MEDIA_COLL.findById(mediaID);

		const infoCommentCall = await broker.call(`${CF_DOMAIN_SERVICES.MEDIA}.${CF_ACTIONS_MEDIA.GET_DETAIL_COMMENT_MEDIA}`, {
			commentID: `${commentID}`,
		});
		const infoComment = infoCommentCall?.data?.infoComent;
		
		if(!infoMedia){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info media" }, 
				event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_COMMENT_IMAGE], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const infoAuthorMedia = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: `${infoMedia?.author}`,
			select: '_id bizname fullname image'
		});

		// Nếu người viết comment là người tạo bài viết thì sẽ không gửi socket
		if( userID != infoMedia?.author) {
			arrReceiver = [infoMedia?.author]
		}
		
		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoMedia,
					infoComment,
					idImageReaction: imageID,
					infoSender: infoSender.data,
					infoAuthorMedia: infoAuthorMedia.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_MEDIA.MEDIA_SSC_COMMENT_IMAGE], io
		});
    },

}