/**
 * CONSTANTS
 */
const { EVENT_SOCKET_CONSTANT_CHATTING } 		= require('./helper/chatting.events-socket-constant');

/**
 * TOOLS
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket')

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_COLL 				= require('./database/chatting.conversation-coll');
const AUTH__USER_COLL							= require('../auth/database/auth.user-coll');

/**
 * MODELS
 */
const USER_MODEL                               	= require('../../services/auth/model/auth.user-model').MODEL;
const CHATTING__MESSAGE_MODEL                  	= require('./model/chatting.message-model').MODEL;
const CHATTING__CONVERSATION_MODEL             	= require('./model/chatting.conversation-model').MODEL;
const CHATTING__CONVERSATION_LINK_MODEL       	= require('./model/chatring.conversation_link-model').MODEL;


exports.CHATTING_SOCKET = {

    [EVENT_SOCKET_CONSTANT_CHATTING.HELLO_WORLD]: async function(data, ack) { 
        let socket                      = this;
        let userID                      = socket.client.user;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let { receivers }               = data;
        
        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }  
        arrReceiver.push(userID)

        // author : HUYNHVINH
        // FUNCTION MAP DATA TO SEND SOCKET: SERVER SEND TO CLIENT
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { message  : 'hello'}, event :'LOGIN_SUCCESS', io})
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
			.populate('authors')
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

        // let { name, description, receiversID, chatPrivate } = data;

        // let arrReceiver = [];
        // if(receivers && receivers.includes(',')) {
        //     arrReceiver = receivers.split(',');
        // } else {
        //     arrReceiver.push(receivers);
        // }   
        // arrReceiver.push(userID);

        // let authorID = userID;

        // if(chatPrivate){
        //     let infoConversation    = await CHATTING__CONVERSATION_MODEL.insert({ name, description, receiverID, authorID });
        //     let infoUser            = await USER_MODEL.findById(userID);
        //     if(infoConversation.error){
        //         return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data : infoConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NEW_CONVERSATION], io})
                 
        //     }

        //     sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : infoConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NEW_CONVERSATION], io})
        // }

        // if(!chatPrivate){
        //     let infoConversation    = await CHATTING__CONVERSATION_MODEL.insertConversationMoreTowMember({ name, description, receivers, authorID });
        //     if(infoConversation.error){
        //         return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data : infoConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NEW_CONVERSATION], io})
        //     }

        //     let infoUser            = await USER_MODEL.getDataById(userID);
        //     sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , 
        //         data : {
        //             infoConversation,
        //             infoUser : { 
        //                 _id         : infoUser._id,
        //                 fullname    : infoUser.fullname,
        //                 image       : infoUser.image,
        //             } 
        //     }, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_NEW_CONVERSATION], io })
        // }
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

		const infoConversation = await CHATTING__CONVERSATION_COLL
			.findById(conversationID)
			.lean();

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_INFO_CONVERSATION], io
			});
		}

		// Không gửi đến user hiện tại
		const arrReceiver = infoConversation.members.filter(memberID => memberID.toString() !== userID.toString());

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

		const infoSender 	= await AUTH__USER_COLL.findById(userID);
		const addedMembers 	= await AUTH__USER_COLL.find({ _id: { $in: membersID } }).select('_id fullname').lean();

		const { members } 	= infoConversation;
		const arrReceiver 	= members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender,
					addedMembers,
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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REMOVE_MEMBER_CONVERSATION], io
			});
		}

		const infoSender 		= await AUTH__USER_COLL.findById(userID);
		const removedMembers 	= await AUTH__USER_COLL.find({ _id: { $in: membersID } }).select('_id fullname').lean();

		const { members } 	= infoConversation;
		const arrReceiver 	= members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender,
					removedMembers,
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
		let listUserActive                 	= socket.$service.listUserConnected2;
		let userID                         	= socket.client.user;
		let io                             	= socket.$service.io;
		let { conversationID, memberID }   	= data;

		let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_UPDATE_ADMIN_CONVERSATION], io
			});
		}
		let infoSender = await AUTH__USER_COLL.findById(userID).select('_id fullname');
		let infoMember = await AUTH__USER_COLL.findById(memberID).select('_id fullname');

		const { members } 	= infoConversation;
		const arrReceiver 	= members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoSender,
					infoMember
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
        let listUserActive              	= socket.$service.listUserConnected2;
        let userID                      	= socket.client.user;
        let io                          	= socket.$service.io;
        let { conversationID, memberID } 	= data; 

        let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);

		if(!infoConversation){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation" }, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_MEMBER_LEAVE_CONVERSATION], io
			});
		}

		let infoMember 	= await AUTH__USER_COLL.findById(memberID).select('_id fullname');
		let arrReceiver = infoConversation.members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMember
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
        let socket              = this;
        let listUserActive      = socket.$service.listUserConnected2;
        let userID              = socket.client.user;
        let io                  = socket.$service.io;
        let { receiversID, infoConversation } = data; 

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver: receiversID,
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
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let { conversationID, messageID, usersTag } = data;

		let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
		let infoMessage		 = await CHATTING__MESSAGE_MODEL.findById(messageID).populate('sender');

		if(!infoConversation || !infoMessage){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: [userID],
				data: { error: true, message: "Can't get info conversation or message" },
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SEND_MESSAGE], io
			});
		}

		if(usersTag){
			return sendDataToMultilSocketsOfListUser({ 
				listUserConnected: listUserActive, 
				arrReceiver: usersTag,
				data: {
					error: false,
					data: {
						infoConversation,
						infoMessage
					}
				}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SEND_MESSAGE], io
			});
		}

		let arrReceiver = infoConversation.members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: {
				error: false,
				data: {
					infoConversation,
					infoMessage
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SEND_MESSAGE], io
		});
    },








	/**
	 * Dev: VinhHV
	 * Func: Đã nhận tin nhắn
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_RECEIVED_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let { messageID, conversationID }           	= data;
        let userID                                      = socket.client.user;
        let io                                         	= socket.$service.io;

        let infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let arrReceiver                = infoConversation.data.members;

        // Cập nhật trạng thái đã nhận tin nhắn.
        let infoUpdate = await CHATTING__MESSAGE_MODEL.updateReceive({ messageID });
        if(!infoUpdate.error){
            return sendDataToMultilSocketsOfListUser({ 
				io,
				arrReceiver,
				listUserConnected: listUserActive, 
				data: {
					messageID, 
					conversationID,
					status: 200
				},
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_RECEIVED_MESSAGE]
			})
        }

        sendDataToMultilSocketsOfListUser({ 
			io,
			arrReceiver: [userID], 
			listUserConnected: listUserActive,
			data: infoUpdate, 
			event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_RECEIVED_MESSAGE]
		})
    },

    // Đã xem tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_SEEN_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let io                                         	= socket.$service.io;
        let authorID                                    = socket.client.user;
        let userID                                      = socket.client.user;
        let { messageID, conversationID } 				= data;

        let infoConversation    			= await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let arrReceiver         			= infoConversation.data.members;

        let infoMessagePromise     	 		= CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });

        let [ infoMessage] 	= await Promise.all([ infoMessagePromise ]);

        if(messageID && infoMessage.error){
			return sendDataToMultilSocketsOfListUser({ 
				io,
				arrReceiver: [userID], 
				listUserConnected: listUserActive, 
				data: {
					error: true, 
					message: 'Params invalid', 
					status: 400
				}, 
				event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SEEN_MESSAGE]
			})
		}

        await CHATTING__MESSAGE_MODEL.seenMessageOneByOne({ messageID, userID: userID });

        sendDataToMultilSocketsOfListUser({ 
			io,
			arrReceiver, 
			listUserConnected: listUserActive, 
			data: { 
				authorID, 
				conversationID, 
				infoMessage 
			}, 
			event: [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_SEEN_MESSAGE]
		})
    },

    // Phản hồi tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_RELY_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let userID                                      = socket.client.user;

        let {   content, conversationID, parentID } = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                = infoConversation.data.members;

        let infoMessageAfterInsert      = await CHATTING__MESSAGE_MODEL.insert({ senderID: userID , content, receivers: arrReceiver , conversationID, parentID });

        if(infoMessageAfterInsert.error){
            return  sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data :  { userID, conversationID, messsage :`cant_reply : ${infoMessageAfterInsert.message}` }, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_RELY_MESSAGE], io})
        }
          
        let messageID = infoMessageAfterInsert.data._id;
        let  infoMessage                = await CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });

        // Tên sự kiện ở server  : CSS_RELY_MESSAGE
        // Đầu vào :  {  tempID, content,  reciverID, conversationID, parentID, oldContent } 

        // Tên sự kiện trả về : SSC_RELY_MESSAGE
        // Nội dung trả về client :  { tempID, infoMessage, userID, oldContent 

        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { userID, conversationID, infoMesage : infoMessage }, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_RELY_MESSAGE], io})
    },

    // Xoá tin nhắn
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_DELETE_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let userID                                      = socket.client.user;
        let {  messageID, conversationID }              = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                = infoConversation.data.members;

        let infoMessage = await CHATTING__MESSAGE_MODEL.removebyID({ messageID, conversationID, senderID :userID });
        if(infoMessage) {
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { infoMessage, status : 200  }, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_DELETE_MESSAGE], io})
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data :  infoMessage, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_DELETE_MESSAGE], io})
    },

    // Reaction tin nhắn
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_REACTION_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let userID                                      = socket.client.user;
        let {  messageID, conversationID, type }        = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let infoLikeMessage             = await CHATTING__MESSAGE_MODEL.toggleLikeMessage({messageID, authorID : userID, type});
        let  arrReceiver                = infoConversation.data.members;

        // console.log({infoLikeMessage})
        if(infoLikeMessage.error){
            return sendDataToMultilSocketsOfListUser({ 
                listUserConnected : listUserActive, arrReceiver,
                data : infoLikeMessage,
                event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REACTION_MESSAGE],
                io
            })
        }

        infoLikeMessage = await CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });
        let infoUser    = await USER_MODEL.getDataById(userID);
 
        // // Lưu thông báo CLOUD MESSASING
        // if(infoLikeMessage.isLike){
        //     arrReceiver.forEach(async receive =>{
        //         if(receive != userID ){
        //             let content = `${fullNameUser} đã like tin nhắn ${infoLikeMessage.data.content}`;
        //             let infoAddNotification =  await DB_NOTIFICATION.insert({ sender : userID, receiver : receive , content, type : 1 , url:'/message' })
        //         }
        //     });
        // }
        //Gửi socket
        sendDataToMultilSocketsOfListUser({ 
            listUserConnected : listUserActive, arrReceiver,
            data :  { 
                infoMessage : infoLikeMessage,
                conversationID, 
                infoUser : {
                    _id         :  infoUser._id,
                    fullname    : infoUser.fullname,
                    image       : infoUser.image
                }
            },
            event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_REACTION_MESSAGE],
            io
        })
    },

    // Tag tên trong tin nhắn  ( cloud message)


    // Pin tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_CSS_PIN_MESSAAGE_CONVERSATION]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let userID                                      = socket.client.user;
        let {  conversationID, messageID, deletePin }   = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                = infoConversation.data.members;

        let inforUpdate 
        if(!deletePin){
            inforUpdate = await CHATTING__CONVERSATION_MODEL.insertPinMessage({ messageID, conversationID, userID });
        }else{
            inforUpdate = await CHATTING__CONVERSATION_MODEL.deletePinMessage({ conversationID, userID });
        }
        if(!inforUpdate.error){
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { infoConversation : inforUpdate, deletePin, status : 200 }, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_PIN_MESSAAGE_CONVERSATION], io})
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data : inforUpdate, event :[EVENT_SOCKET_CONSTANT_CHATTING.CHATTING_SSC_PIN_MESSAAGE_CONVERSATION], io})
    },
}