/**
 * CONSTANTS
 */
const { EVENT_SOCKET_CONSTANT_CHATTING } 		= require('./helper/chatting.events-socket-constant');

/**
 * TOOLS
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket')
const { getLinkFromStringV1 } 					= require('../../tools/utils/utils.js')

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
const CHATTING__CONVERSATION_DRAFT_MODEL       	= require('./model/chatting.coversation_draft-model').MODEL;
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

    //================================================================CONVERSATION================================================================
    // Thông báo Tạo cuộc hội thoại mới [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_NEW_CONVERSATION]: async function(data, ack) { 
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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_NEW_CONVERSATION], io
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
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_NEW_CONVERSATION], io
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
        //         return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data : infoConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_NEW_CONVERSATION], io})
                 
        //     }

        //     sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : infoConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_NEW_CONVERSATION], io})
        // }

        // if(!chatPrivate){
        //     let infoConversation    = await CHATTING__CONVERSATION_MODEL.insertConversationMoreTowMember({ name, description, receivers, authorID });
        //     if(infoConversation.error){
        //         return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data : infoConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_NEW_CONVERSATION], io})
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
        //     }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_NEW_CONVERSATION], io })
        // }
    },
    
    // Sửa tên cuộc hội thoại [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_UPDATE_INFO_CONVERSATION]: async function(data, ack) { 
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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_UPDATE_INFO_CONVERSATION], io
			});
		}

		// Không gửi đến user hiện tại
		const arrReceiver = infoConversation.members.filter(memberID => memberID.toString() !== userID.toString());

		sendDataToMultilSocketsOfListUser({ 
			listUserConnected: listUserActive, 
			arrReceiver,
			data: { error: false, data: infoConversation },
			event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_UPDATE_INFO_CONVERSATION], io
		});

        // let infoAfterUpdate = await CHATTING__CONVERSATION_MODEL.updateByID({ name, conversationID, userID});
        // if(!infoAfterUpdate.error){
        //     let  arrReceiver    = infoAfterUpdate.data.members;
        //     sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data :{  name, userID, infoConversation : infoAfterUpdate, status : 200 }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_UPDATE_INFO_CONVERSATION], io})
        //     let content = `${name}`;
        //     let type  = 3;   // Trạng thái tin nhắn thông báo cho cả nhóm vd: user1 vừa bị xóa
        //     let infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insert(
        //     { senderID: userID , content, receivers , conversationID, type });
        //     // arrReceiver.forEach(async receive =>{
        //     //     if(receive != userID ){
        //     //         let content = `${infoAfterUpdate.oldName}`;
        //     //         let infoAddNotification =  await DB_NOTIFICATION.insert({ sender : userID, receiver : receive , content, type : MESSAGE_UPDATE_INFO_CONVERSATION , url:'/message/home' })
        //     //     }
        //     // });
        //     return
        // }
        // sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data : infoAfterUpdate, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_UPDATE_INFO_CONVERSATION], io})
    },

    // Xét làm admin
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_SET_ADMIN_MESSAGE]: async function(data, ack) { 
        let socket                                          = this;
        let listUserActive                                  = socket.$service.listUserConnected2;
        let userID                                          = socket.client.user;
        let  io                                             = socket.$service.io;

        let {  memberID, conversationID }          = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                = infoConversation.data.members;
        
        let resultUpdateAdmin;
        if(!conversationID)
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data : { error : true, status: 403, mesage:'Params invalid'}, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_SET_ADMIN_MESSAGE], io})

        resultUpdateAdmin = await CHATTING__CONVERSATION_MODEL.insertNewAdmin({ member : memberID, conversationID, authorID : userID });
        if(resultUpdateAdmin && !resultUpdateAdmin.error){
            arrReceiver                     = [... memberID];
            let type                        = 5;// trạng thái tin nhắn thông báo cho cả nhốm vf: user1 vừa bị xóa
            let infoNewAdmin                = await USER_MODEL.getDataById(memberID);
            let content                     = infoNewAdmin.fullname;
            let infoMessageAfterInsert      = await CHATTING__MESSAGE_MODEL.insert({ senderID: userID , content, receivers : arrReceiver , conversationID, type })
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  {  infoConversation  : resultUpdateAdmin, infoMessage : infoMessageAfterInsert.data }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_SET_ADMIN_MESSAGE], io})
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data :resultUpdateAdmin, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_SET_ADMIN_MESSAGE], io})

    },

    // Xoá admin
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_REMOVE_ADMIN_MESSAGE]: async function(data, ack) { 
        let socket                                          = this;
        let listUserActive                                  = socket.$service.listUserConnected2;
        let userID                                          = socket.client.user;
        let  io                                             = socket.$service.io;

        let { adminID, conversationID }  = data;
        let  infoConversation            = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                 = infoConversation.data.members;
        
        let resultUpdateAdmin;
        if(!conversationID){
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data :  { message: 'Parameters validation error!', status :400 }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_REMOVE_ADMIN_MESSAGE], io})
        }
         
        resultUpdateAdmin= await DB_MESSAGE_CONVERSATION_MODEL.removeAdmin({ adminID , conversationID, authorID : userID });
        if(resultUpdateAdmin && !resultUpdateAdmin.error){
            let type                    = 7;// trạng thái tin nhắn thông báo cho cả nhốm vf: user1 vừa bị xóa
            let infoNewAdmin            = await USER_MODEL.getDataById(adminID);
            let content                 = infoNewAdmin.fullname;
            let infoMessageAfterInsert  = await CHATTING__MESSAGE_MODEL.insert({ senderID: userID , content, receivers : arrReceiver  , conversationID, type });
           return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  {  infoConversation  : resultUpdateAdmin, infoMessage : infoMessageAfterInsert.data }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_REMOVE_ADMIN_MESSAGE], io})
        }

        return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data :  resultUpdateAdmin, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_REMOVE_ADMIN_MESSAGE], io})
    },
    
    // Thêm thành viên vào cuộc hội thoại
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_ADD_MEMBER_CONVERSATION]: async function(data, ack) { 
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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_ADD_MEMBER_CONVERSATION], io
			});
		}

		const infoSender = await AUTH__USER_COLL.findById(userID);

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
					addedMembersID: membersID,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_ADD_MEMBER_CONVERSATION], io
		});

    },

    // Xoá thành viên khỏi cuộc hội thoại
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_REMOVE_MEMBER_CONVERSATION]: async function(data, ack) { 
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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_REMOVE_MEMBER_CONVERSATION], io
			});
		}

		const infoSender = await AUTH__USER_COLL.findById(userID);

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
					removedMembersID: membersID,
				}
			}, event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_REMOVE_MEMBER_CONVERSATION], io
		});

    },

    // Rời khỏi nhóm
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_LEAVE_CONVERSATION]: async function(data, ack) { 
      
        let socket                      = this;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;
        let { conversationID, isMute, time } = data; 

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.leaveByConversationID({ conversationID, userID });
        
        if(!infoAfterAdd.error){
            let  infoConversation       = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
            let  arrReceiver            = infoConversation.data.members;
            return  sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { arrNewMember : members, conversationID }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_LEAVE_CONVERSATION], io })
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver  : [userID], data : infoAfterAdd, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_LEAVE_CONVERSATION], io })

    },
    // Xoá Nhóm

    // Tắt Thông báo nhóm
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_MUTE_CONVERSATION]: async function(data, ack) { 
        let socket                      = this;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let { conversationID, isMute, time } = data; 
        let  updateConversation;

        if(isMute){
            updateConversation       = await CHATTING__CONVERSATION_MODEL.muteConversation({ conversationID, userID, time });
        }else{
            updateConversation       = await CHATTING__CONVERSATION_MODEL.unMuteConversation({ conversationID, userID });
        }
        
        if(!updateConversation.error){
            let  infoConversation       = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
            let  arrReceiver            = infoConversation.data.members;
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { isMute, infoConversation : updateConversation }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_MUTE_CONVERSATION], io })
        }else{
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data : updateConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_MUTE_CONVERSATION], io })
        }
    },
    
    // Pin cuộc hội thoại 
    // Tắt Thông báo nhóm
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_PIN_CONVERSATION]: async function(data, ack) { 
        let socket                      = this;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let { conversationID, isPin } = data; 
        let  updateConversation;

        if(isPin){
            updateConversation       = await CHATTING__CONVERSATION_MODEL.pinConversation({ conversationID, userID });
        }else{
            updateConversation       = await CHATTING__CONVERSATION_MODEL.unPinConversation({ conversationID, userID });
        }
        
        if(!updateConversation.error){
            let  infoConversation       = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
            let  arrReceiver            = infoConversation.data.members;
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { isPin, infoConversation : updateConversation }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_PIN_CONVERSATION], io })
        }else{
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data : updateConversation, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_PIN_CONVERSATION], io })
        }
    },

    //========================= MESSAGE ===============================

	/**
	 * Dev: VinhHV
	 * Func: Gửi tin nhắn
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_SEND_MESSAGE]: async function(data, ack) {
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

		// console.log({ socketID, userID, listUserActive, data });

        let { content, receivers, conversationID, messageID, isLikeIcon, isShareMessage, messageShareID } = data;

        let infoConversation       = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let arrReceiver            = infoConversation.data.members;

        async function addMessage(infoConversation){
            let infoMessageAfterInsert = null;

			// II.2.1. Tin nhắn thường
			// II.2.2. Tin nhắn reply
			if(content && !isLikeIcon){
				infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insert({ 
					senderID: userID, 
					content, 
					receivers: arrReceiver, 
					conversationID
				});
				links = getLinkFromStringV1(content);
			}

			// II.2.3. Gửi nút like
			if(isLikeIcon){
				infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insert({ 
					senderID: userID, 
					content, 
					receivers, 
					conversationID, 
					type: 8 
				});
			}

            // II.2.4. Chia sẽ tin nhắn
			if(isShareMessage){
				infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.copyMessage({ 
					senderID: userID, 
					receivers: arrReceiver, 
					conversationID, 
					messageShareID 
				});
			}

            // II.2.5 Tổng hợp link cuộc hội thoại nếu có gửi link
            if(links && links.length){
                // let infoConversationAfterInsertLinks = await CHATTING__CONVERSATION_MODEL.updateLinks({ conversationID, userID, links });
                let listPomiseSaveLink = [];
                links && links.forEach(link => {
					let insertLinkConversation = CHATTING__CONVERSATION_LINK_MODEL.insert({ conversationID, userID, link });
                    listPomiseSaveLink[listPomiseSaveLink.length] = insertLinkConversation;
                })

                await Promise.all(listPomiseSaveLink) ;
            }

            // II.2.6 Nếu thành công gửi socket và cloud messaging 
            if(!infoMessageAfterInsert.error) {
                let messageID 	= infoMessageAfterInsert.data._id;
                // let infoMessage = await CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });

                sendDataToMultilSocketsOfListUser({ 
					io,
					event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_SEND_MESSAGE],
					arrReceiver,
					listUserConnected: listUserActive,
					data: {
						infoConversation,
						infoMessage: infoMessageAfterInsert
					}
				})

                // if(infoConversation){
                //     // GỬI TỚI NOTIFI TỚI MOBILE
                //     let messageNoti = `${infoUser.fullname} : ${infoMessage.data.content}`;
                //     let title       = infoConversation.data.name;
                //     if(infoConversation.data.members.length == 2){
                //         title = `${infoUser.fullname}`;
                //     }

                //     infoConversation  = JSON.stringify(infoConversation)
                //     let body = {
                //         screen_key: `${CHAT_CONTENT}`,
                //         userID,
                //         receivers,
                //         conversationID,
                //         title,
                //         sound:"default" 
                //     }
                //     console.log({
                //         arrReceiver, messageNoti, body, userID
                //     });
                //     sendMessageMobile(arrReceiver, messageNoti, body, userID) 
                // }

                // I. Lưu trạng thái chưa đọc tin nhắn cho các thành viên trong nhóm
                await CHATTING__CONVERSATION_DRAFT_MODEL.insertOrUpdate({ conversationID, userID, message: '' });

                // let infoConversation;
                let links = [];
                let arrayPromiseUpdateUserMissMess = [];

                // Lọc mãng lưu những user trong cuộc hội thoại là chưa xem tin nhắn
                arrReceiver.forEach(reciver => {
                    if(reciver != userID.toString()){
                        arrayPromiseUpdateUserMissMess = [...arrayPromiseUpdateUserMissMess, CHATTING__CONVERSATION_MODEL.updateUserMissMessage({ sender: userID, conversationID, userID: reciver })]
                    }
                });

                return await Promise.all(arrayPromiseUpdateUserMissMess);
            }

            sendDataToMultilSocketsOfListUser({ 
				io,
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_SEND_MESSAGE],
				listUserConnected: listUserActive, 
				arrReceiver: [userID], 
				data: infoMessageAfterInsert,
			})
        }

        // II.1 Gửi tin nhắn chứa file đínnh kèm
        if(messageID && messageID.length){
            // I. Lưu trạng thái chưa đọc tin nhắn cho các thành viên trong nhóm
            // I. Lưu trạng thái chưa đọc tin nhắn cho các thành viên trong nhóm
            await CHATTING__CONVERSATION_DRAFT_MODEL.insertOrUpdate({ 
				conversationID, 
				userID, 
				message: ''
			});

            let links = [];
            let infoConversation;
            let arrayPromiseUpdateUserMissMess = [];

            // Lọc mãng lưu những user trong cuộc hội thoại là chưa xem tin nhắn
            arrReceiver.forEach(receiver => {
                if(receiver != userID.toString()){
					let updateUserMissMessagePromise = DB_MESSAGE_CONVERSATION_MODEL.updateUserMissMessage({ 
						sender: userID, 
						userID: receiver,
						conversationID
					});
                    arrayPromiseUpdateUserMissMess = [...arrayPromiseUpdateUserMissMess, updateUserMissMessagePromise];
                }
            });

            await Promise.all(arrayPromiseUpdateUserMissMess);
            // addMesaageWithFile();
        } else{
			//II.2
            // Gửi tin nhắn bình thường
            // Có các trạng thái :
            // II.2.1. Tin nhắn thường
            // II.2.2. Tin nhắn reply
            // II.2.3. Gửi nút like
            // II.2.4. Chia sẽ tin nhắn
            addMessage(infoConversation);
        }

        //III Cập nhật người bạn liên hệ gần nhất
        // if(arrReceiver.length == 2){
        //     let friendID ='';
        //     arrReceiver.forEach(receiverID =>{
        //         if(receiverID != userID.toString()){
        //             friendID = receiverID;
        //         }
        //     });
        //     await USER_MODEL.updateRecentlyFriends({userID, friendID});
        // }
    },

	/**
	 * Dev: VinhHV
	 * Func: Đang soạn tin  nhắn
	 * Date: ...
	 * Updated: lưu bản nháp vào conversation_draft-coll
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_TYPING_MESAGE]: async function(data, ack) { 
        let socket                                          = this;
        let listUserActive                                  = socket.$service.listUserConnected2;
        let userID                                          = socket.client.user;
        let { typing, conversationID, content }           	= data;
        let io                                             	= socket.$service.io;

        let infoConversation       = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let arrReceiver            = infoConversation.data.members;

        await CHATTING__CONVERSATION_MODEL.updateUserMissMessage({ conversationID, userID, isRep: true })
        await CHATTING__CONVERSATION_DRAFT_MODEL.insertOrUpdate({ conversationID, userID, message: content });

        sendDataToMultilSocketsOfListUser({ 
			io,
			arrReceiver,
			listUserConnected: listUserActive,
			data: { 
				typing, 
				conversationID, 
				user: userID, 
				status: 200  
			}, 
			event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_TYPING_MESAGE]
		})
    },

	/**
	 * Dev: VinhHV
	 * Func: Đã nhận tin nhắn
	 * Date: ...
	 */
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_RECEIVED_MESSAGE]: async function(data, ack) { 
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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_RECEIVED_MESSAGE]
			})
        }

        sendDataToMultilSocketsOfListUser({ 
			io,
			arrReceiver: [userID], 
			listUserConnected: listUserActive,
			data: infoUpdate, 
			event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_RECEIVED_MESSAGE]
		})
    },

    // Đã xem tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_SEEN_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let io                                         	= socket.$service.io;
        let authorID                                    = socket.client.user;
        let userID                                      = socket.client.user;
        let { messageID, conversationID } 				= data;

        let infoConversation    			= await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let arrReceiver         			= infoConversation.data.members;

        let infoUpdateMissMessagePromise 	= CHATTING__CONVERSATION_MODEL.updateUserMissMessage({ 
			conversationID,
			userID, 
			isRep: true 
		});
        let infoMessagePromise     	 		= CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });

        let [inforUpdateMiss, infoMessage] 	= await Promise.all([ infoUpdateMissMessagePromise, infoMessagePromise ]);

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
				event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_SEEN_MESSAGE]
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
			event: [EVENT_SOCKET_CONSTANT_CHATTING.SSC_SEEN_MESSAGE]
		})
    },

    // Phản hồi tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_RELY_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let userID                                      = socket.client.user;

        let {   content, conversationID, parentID } = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                = infoConversation.data.members;

        let infoMessageAfterInsert      = await CHATTING__MESSAGE_MODEL.insert({ senderID: userID , content, receivers: arrReceiver , conversationID, parentID });

        if(infoMessageAfterInsert.error){
            return  sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID], data :  { userID, conversationID, messsage :`cant_reply : ${infoMessageAfterInsert.message}` }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_RELY_MESSAGE], io})
        }
          
        let messageID = infoMessageAfterInsert.data._id;
        let  infoMessage                = await CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });

        // Tên sự kiện ở server  : CSS_RELY_MESSAGE
        // Đầu vào :  {  tempID, content,  reciverID, conversationID, parentID, oldContent } 

        // Tên sự kiện trả về : SSC_RELY_MESSAGE
        // Nội dung trả về client :  { tempID, infoMessage, userID, oldContent 

        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { userID, conversationID, infoMesage : infoMessage }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_RELY_MESSAGE], io})
    },

    // Xoá tin nhắn
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_DELETE_MESSAGE]: async function(data, ack) { 
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let userID                                      = socket.client.user;
        let {  messageID, conversationID }              = data;

        let  infoConversation           = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ conversationID, userID });
        let  arrReceiver                = infoConversation.data.members;

        let infoMessage = await CHATTING__MESSAGE_MODEL.removebyID({ messageID, conversationID, senderID :userID });
        if(infoMessage) {
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { infoMessage, status : 200  }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_DELETE_MESSAGE], io})
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data :  infoMessage, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_DELETE_MESSAGE], io})
    },

    // Reaction tin nhắn
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_REACTION_MESSAGE]: async function(data, ack) { 
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
                event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_REACTION_MESSAGE],
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
            event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_REACTION_MESSAGE],
            io
        })
    },

    // Tag tên trong tin nhắn  ( cloud message)


    // Pin tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_PIN_MESSAAGE_CONVERSATION]: async function(data, ack) { 
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
            return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { infoConversation : inforUpdate, deletePin, status : 200 }, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_PIN_MESSAAGE_CONVERSATION], io})
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data : inforUpdate, event :[EVENT_SOCKET_CONSTANT_CHATTING.SSC_PIN_MESSAAGE_CONVERSATION], io})
    },
}