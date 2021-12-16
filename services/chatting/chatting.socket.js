/**
 * CONSTANTS
 */
const { EVENT_SOCKET_CONSTANT_CHATTING } 		= require('./helper/chatting.events-socket-constant');
const { CF_DOMAIN_SERVICES } 					= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');

/**
 * TOOLS
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_COLL 				= require('./database/chatting.conversation-coll');
const CHATTING__MESSAGE_COLL 					= require('./database/chatting.message-coll');

/**
 * MODELS
 */
const CHATTING__MESSAGE_MODEL 					= require('./model/chatting.message-model').MODEL;


exports.CHATTING_SOCKET = {

    'CLIENT_SEND_CHATTING_TEST': async function(data, ack) { 
        let socket                      = this;
        let userID                      = socket.client.user;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;

		console.log({ data })

        sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver: [userID], 
			data: {
				message: "Hi Client!! I'm server...",
				userID,
				listUserActive
			}, 
			event: 'SERVER_SEND_CHATTING_TEST', io
		})
    },

    // =============================== CONVERSATION ==================================

	/**
	 * Dev: MinhVH
	 * Func: Tạo cuộc hội thoại mới
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_NEW_CONVERSATION]: async function(data, ack) { 
        let socket                      = this;
        let listUserActive              = socket.$service.listUserConnected2;
        let userID                      = socket.client.user;
        let io                          = socket.$service.io;
		let { conversationID } 			= data;

		const infoConversation = await CHATTING__CONVERSATION_COLL
			.findById(conversationID)
			.populate({
				path: 'authors',
				select: '_id fullname bizname image'
			})
			.lean();

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NEW_CONVERSATION], io
			});
		}

		const { authors, members } 	= infoConversation;
		const arrReceiver 			= members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoAuthor: { 
						_id      : authors[0]._id,
						fullname : authors[0].fullname,
						image    : authors[0].image,
					} 
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NEW_CONVERSATION], io
		});
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật cuộc hội thoại
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_UPDATE_INFO_CONVERSATION]: async function(data, ack) { 
        let socket                 	= this;
        let listUserActive         	= socket.$service.listUserConnected2;
        let io                     	= socket.$service.io;
        let userID                 	= socket.client.user;
        let { conversationID } 		= data;

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_INFO_CONVERSATION], io
			});
		}

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: { error: false, data: infoConversation },
			event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_INFO_CONVERSATION], io
		});

    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm thành viên vào cuộc hội thoại
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_ADD_MEMBER_CONVERSATION]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
        let { conversationID, membersID } 	= data;

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_ADD_MEMBER_CONVERSATION], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});
		const addedMembers = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_USER_WITH_CONDITION}`, {
			condition: { _id: { $in: membersID } },
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender: infoSender.data,
					addedMembers: addedMembers.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_ADD_MEMBER_CONVERSATION], io
		});

    },

	/**
	 * Dev: MinhVH
	 * Func: Xoá thành viên khỏi cuộc hội thoại
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_REMOVE_MEMBER_CONVERSATION]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let io                          	= socket.$service.io;
        let userID                      	= socket.client.user;
		let { conversationID, memberID } 	= data;

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MEMBER_CONVERSATION], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});
		const removedMember = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_USER_WITH_CONDITION}`, {
			condition: { _id: memberID },
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender: infoSender.data,
					removedMember: removedMember.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MEMBER_CONVERSATION], io
		});

    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật admin cho cuộc hội thoại
	 * Date: 11/08/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_UPDATE_ADMIN_CONVERSATION]: async function(data, ack) { 
		let socket                         	= this;
		let broker                      	= socket.$service.broker;
		let listUserActive                 	= socket.$service.listUserConnected2;
		let userID                         	= socket.client.user;
		let io                             	= socket.$service.io;
		let { conversationID, memberID, isSetAdmin } = data;

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_ADMIN_CONVERSATION], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});
		const infoMember = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: memberID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender: infoSender.data,
					infoMember: infoMember.data,
					isSetAdmin
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_ADMIN_CONVERSATION], io
		});

	},

	/**
	 * Dev: MinhVH
	 * Func: Member rời khỏi cuộc hội thoại
	 * Date: 15/08/2021
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_MEMBER_LEAVE_CONVERSATION]: async function(data, ack) { 
        let socket                      	= this;
		let broker                      	= socket.$service.broker;
        let listUserActive              	= socket.$service.listUserConnected2;
        let userID                      	= socket.client.user;
        let io                          	= socket.$service.io;
        let { conversationID, memberID } 	= data; 

        const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_MEMBER_LEAVE_CONVERSATION], io
			});
		}

		const infoMember = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: memberID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMember: infoMember.data
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_MEMBER_LEAVE_CONVERSATION], io
		});
    },

	/**
	 * Dev: MinhVH
	 * Func: Giải tán cuộc hội thoại (xóa nhóm)
	 * Date: 15/08/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_REMOVE_CONVERSATION]: async function(data, ack) { 
        let socket               = this;
        let listUserActive       = socket.$service.listUserConnected2;
        let userID               = socket.client.user;
        let io                   = socket.$service.io;
        let { infoConversation } = data;

		const { members } = infoConversation;
		const arrReceiver = members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: { infoConversation }
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_CONVERSATION], io
		});
    },



    //========================= MESSAGE ===============================

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn trong cuộc hội thoại (text, emoij, tag name)
	 * Date: 17/08/2021
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_SEND_MESSAGE]: async function(data, ack) {
        let socket                      = this;
		let broker                      = socket.$service.broker;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let {
			tmpid, conversationID, content, parentID, usersAssigned, files, location, type, usersTag,
			notifyFor, remindTime, repeat,
			name, options,
		} = data;

		let infoMessageAfterInsert = {};

		switch (+type) {
			case 4:
				infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insertMessageReminder({
					conversationID, content, notifyFor, remindTime, repeat, userID, ctx: broker
				});
				break;
			case 5:
				infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insertMessagePoll({
					conversationID, name, options, userID
				});
				break;
			default:
				infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID, 
					senderID: userID, 
					content,
					parentID, 
					usersAssigned, 
					files,
					location,
					type,
					ctx: broker
				})
				break;
		}

		if(infoMessageAfterInsert.error){
			return sendDataToMultilSocketsOfListUser({
				listUserConnected: listUserActive,
				arrReceiver: [userID],
				data: {
					tmpid,
					infoMessage: infoMessageAfterInsert,
				},
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_RECEIVE_MESSAGE], io
			});
		}

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi thông báo đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		if(usersTag && usersTag.length){
			usersTag = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_USER_WITH_CONDITION}`, {
				condition: { _id: { $in: usersTag } },
				select: '_id bizname fullname image'
			});
			usersTag = usersTag.data;
		}

		let infoMessage = null;

		if(infoMessageAfterInsert.data){
			infoMessage = await CHATTING__MESSAGE_COLL
				.findById(infoMessageAfterInsert.data._id, { createdAt: 0, updatedAt: 0, __v: 0 })
				.populate({
					path: 'sender receivers usersAssigned',
					select: '_id fullname bizname image'
				})
				.populate('parent reminder')
				.populate({
					path: 'poll',
					populate: {
						path: 'options.usersVote',
						select: '_id bizname fullname image'
					}
				})
				.populate({
					path: 'files.file',
					populate: {
						path: 'file',
						select: 'name url size'
					},
				})
				.lean();
		}

		// SEND SOCKET
		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver: members,
			data: {
				tmpid,
				usersTag,
				infoMessage,
			},
			event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_RECEIVE_MESSAGE], io
		});

		let description = infoMessage.content;
		let senderFullname = '';

		let infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: 'fullname'
		});

		if(members.length > 2){
			senderFullname = infoSender.fullname;
			description = `${senderFullname}: ${description}`;
		}

		switch (infoMessage.type) {
			case 1:
				description = `${senderFullname} đã gửi 1 ảnh`;
				break;
			case 2:
				description = `${senderFullname} đã gửi 1 file`;
				break;
			case 4:
				description = `${senderFullname} đã tạo 1 nhắc hẹn`;
				break;
			case 5:
				description = `${senderFullname} đã tạo 1 cuộc bình chọn`;
				break;
			default:
				break;
		}

		console.log({ arrReceiver })

		// SEND CLOUD-MSG
		broker.emit("NOTIFICATION__LOG_CREATE:MOBILE", { 
			users: arrReceiver,
			title: members.length === 2 ? infoSender.fullname : infoConversation.name,
			description
		});
    },

	/**
	 * Dev: MinhVH
	 * Func: Chia sẻ tin nhắn đến các cuộc hội thoại 
	 * Date: 25/08/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_SHARE_MESSAGE]: async function(data, ack) {
		let socket                      = this;
		let listUserActive              = socket.$service.listUserConnected2;
		let io                          = socket.$service.io;
		let userID                      = socket.client.user;
		let { conversationsID, messagesID } = data;

		if(!conversationsID || !conversationsID.length || !messagesID || !messagesID.length){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" },
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SHARE_MESSAGE], io
			});
		}

		conversationsID.map(async conversationID => {
			const infoConversation 	 = await CHATTING__CONVERSATION_COLL.findById(conversationID);
			const listMessagesShared = await CHATTING__MESSAGE_COLL
				.find({
					_id: { $in: messagesID }
				})
				.populate({
					path: 'parent poll reminder files.file',
					populate: 'file'
				})
				.populate({
					path: 'sender usersAssigned',
					select: '_id bizname fullname image',
				})
				.lean();

			const { members, usersMute } = infoConversation;
			const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

			// Không gửi đến user tắt thông báo cuộc hội thoại
			const arrReceiver = members.filter(memberID => {
				return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
			});

			sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver,
				data: {
					error: false,
					data: {
						infoConversation,
						listMessagesShared
					}
				}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SHARE_MESSAGE], io
			});
		})

	},

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật người tham gia nhắc hẹn
	 * Date: 04/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_UPDATE_USER_JOIN_REMINDER]: async function(data, ack) { 
		let socket                      	= this;
		let broker                      	= socket.$service.broker;
		let listUserActive              	= socket.$service.listUserConnected2;
		let userID                      	= socket.client.user;
		let io                          	= socket.$service.io;
		let { conversationID, memberID, isJoin } = data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_USER_JOIN_REMINDER], io
			});
		}

		const infoMember = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID: memberID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMember: infoMember.data,
					isJoin
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_USER_JOIN_REMINDER], io
		});
	},

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật tin nhắn nhắc hẹn
	 * Date: 06/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_UPDATE_MESSAGE_REMINDER]: async function(data, ack) { 
		let socket              			= this;
		let broker              			= socket.$service.broker;
		let listUserActive      			= socket.$service.listUserConnected2;
		let userID              			= socket.client.user;
		let io                  			= socket.$service.io;
		let { conversationID, messageID }	= data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
		const infoMessage	   = await CHATTING__MESSAGE_COLL
			.findById(messageID)
			.populate('reminder')
			.populate({
				path: 'sender',
				select: '_id bizname fullname image'
			})
			.lean();

		if(!infoConversation || !infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_MESSAGE_REMINDER], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMessage,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_MESSAGE_REMINDER], io
		});
	},

	/**
	 * Dev: MinhVH
	 * Func: Xoá tin nhắn nhắc hẹn
	 * Date: 06/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_REMOVE_MESSAGE_REMINDER]: async function(data, ack) { 
		let socket              			= this;
		let broker              			= socket.$service.broker;
		let listUserActive      			= socket.$service.listUserConnected2;
		let userID              			= socket.client.user;
		let io                  			= socket.$service.io;
		let { conversationID, messageID } 	= data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
		const infoMessage	   = await CHATTING__MESSAGE_COLL
			.findById(messageID)
			.populate('reminder')
			.populate({
				path: 'sender',
				select: '_id bizname fullname image'
			})
			.lean();

		if(!infoConversation || !infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MESSAGE_REMINDER], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMessage,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MESSAGE_REMINDER], io
		});
	},

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật tin nhắn bình chọn
	 * Date: 06/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_UPDATE_MESSAGE_POLL]: async function(data, ack) { 
		let socket              			= this;
		let broker              			= socket.$service.broker;
		let listUserActive      			= socket.$service.listUserConnected2;
		let userID              			= socket.client.user;
		let io                  			= socket.$service.io;
		let { conversationID, messageID }	= data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
		const infoMessage	   = await CHATTING__MESSAGE_COLL
			.findById(messageID)
			.populate('poll')
			.populate({
				path: 'sender',
				select: '_id bizname fullname image'
			})
			.lean();

		if(!infoConversation || !infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_MESSAGE_POLL], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMessage,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_MESSAGE_POLL], io
		});
	},

	/**
	 * Dev: MinhVH
	 * Func: Xoá tin nhắn bình chọn
	 * Date: 06/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_REMOVE_MESSAGE_POLL]: async function(data, ack) { 
		let socket              			= this;
		let broker              			= socket.$service.broker;
		let listUserActive      			= socket.$service.listUserConnected2;
		let userID              			= socket.client.user;
		let io                  			= socket.$service.io;
		let { conversationID, messageID } 	= data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
		const infoMessage	   = await CHATTING__MESSAGE_COLL
			.findById(messageID)
			.populate('poll')
			.populate({
				path: 'sender',
				select: '_id bizname fullname image'
			})
			.lean();

		if(!infoConversation || !infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MESSAGE_POLL], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMessage,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MESSAGE_POLL], io
		});
	},

	/**
	 * Dev: MinhVH
	 * Func: Pin 1 tin nhắn
	 * Date: 06/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_PIN_MESSAGE]: async function(data, ack) { 
		let socket              = this;
		let broker              = socket.$service.broker;
		let listUserActive      = socket.$service.listUserConnected2;
		let userID              = socket.client.user;
		let io                  = socket.$service.io;
		let { conversationID } 	= data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_PIN_MESSAGE], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_PIN_MESSAGE], io
		});
	},

	/**
	 * Dev: MinhVH
	 * Func: Bỏ pin 1 tin nhắn
	 * Date: 06/09/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_UNPIN_MESSAGE]: async function(data, ack) { 
		let socket              = this;
		let broker              = socket.$service.broker;
		let listUserActive      = socket.$service.listUserConnected2;
		let userID              = socket.client.user;
		let io                  = socket.$service.io;
		let { conversationID } 	= data; 

		const infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UNPIN_MESSAGE], io
			});
		}

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

		const { members, usersMute } = infoConversation;
		const listMemberIDMuteConversation = usersMute.map(userID => userID.toString());

		// Không gửi đến user tắt thông báo cuộc hội thoại
		const arrReceiver = members.filter(memberID => {
			return memberID.toString() !== userID.toString() && !listMemberIDMuteConversation.includes(memberID.toString())
		});

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender: infoSender.data,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UNPIN_MESSAGE], io
		});
	},

    /**
	 * Dev: MinhVH
	 * Func: Thông báo nhắc hẹn
	 * Date: 13/09/2021
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_NOTIFICATION_REMINDER]: async function(data, ack) { 
        let socket               					= this;
        let listUserActive       					= socket.$service.listUserConnected2;
        let io                   					= socket.$service.io;
		let { conversationID, messageID, userID }	= data;

		const infoConversation 	= await CHATTING__CONVERSATION_COLL.findById(conversationID);
		const infoMessage 		= await CHATTING__MESSAGE_COLL
			.findById(messageID)
			.populate('reminder');

		if(!infoConversation || !infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NOTIFICATION_REMINDER], io
			});
		}

		const { members } = infoConversation;
		const { notifyFor, accepts, status } = infoMessage.reminder;

		// Reminder deleted
		if(status === 2) return;

		if(notifyFor === 'onlyme'){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: false, data: infoMessage }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NOTIFICATION_REMINDER], io
			});
		}

		// Lọc user không phải member của conversation
		const listMembersIDConversation = members.map(memberID => memberID.toString());
		const arrReceiver = accepts.filter(memberID => {
			return listMembersIDConversation.includes(memberID.toString())
		});

        sendDataToMultilSocketsOfListUser({ 
			io,
			arrReceiver, 
			listUserConnected: listUserActive, 
			data: { error: false, data: infoMessage }, 
			event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NOTIFICATION_REMINDER]
		})
    },

	/**
	 * Dev: MinhVH
	 * Func: Reaction 1 tin nhắn
	 * Date: 26/10/2021
	 */
	[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_REACTION_MESSAGE]: async function(data, ack) { 
        let socket               		= this;
		let userID              		= socket.client.user;
		let broker                      = socket.$service.broker;
        let listUserActive       		= socket.$service.listUserConnected2;
        let io                   		= socket.$service.io;
		let { messageID, typeReaction }	= data;

		const infoMessage = await CHATTING__MESSAGE_COLL.findById(messageID);

		if(!infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info message" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REACTION_MESSAGE], io
			});
		}

		const infoAfterReaction = await CHATTING__MESSAGE_MODEL.reactionMessage({
			userID,
			messageID,
			typeReaction,
			ctx: broker
		})

		const infoSender = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
			userID,
			select: '_id bizname fullname image'
		});

        sendDataToMultilSocketsOfListUser({ 
			io,
			arrReceiver: [infoMessage.sender], 
			listUserConnected: listUserActive, 
			data: {
				error: false, 
				data: {
					infoSender,
					infoMessage,
					infoReaction: infoAfterReaction
				}
			}, 
			event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REACTION_MESSAGE]
		})
    },

}