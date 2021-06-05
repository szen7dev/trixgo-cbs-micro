//
const { EVENT_SOCKET_CONSTANT_CHATTING } = require('./helper/chatting.events.socket-constant');

//TOOL
const  { sendDataToMultilSocketsOfListUser } = require('../../tools/socket/index.js')
const  { getLinkFromStringV1 } = require('../../tools/utils/utils.js')

// MODEL
const  USER_MODEL = require('../../services/auth/model/auth.user-model').MODEL;
const  CHATTING__MESSAGE_MODEL      = require('./model/chatting.message-model').MODEL;
const  CHATTING__CONVERSATION_MODEL = require('./model/chatting.conversation-model').MODEL;


exports.CHATTING_SOCKET = {

    [EVENT_SOCKET_CONSTANT_CHATTING.HELLO_WORLD]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        // let listUserActive              = socket.$service.listUserConnected;
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
    // Tạo cuộc hội thoại mới [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_NEW_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let userID                      = socket.client.user;
        let io                          = socket.$service.io;

        let { name, description,  receivers, chatPrivate } = data;

        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }   
        arrReceiver.push(userID);

        let authorID = userID;
        if(chatPrivate){
            // let infoConversation    = await CHATTING__CONVERSATION_MODEL.getInfoByID({ conversationID, userID });
            let infoConversation    = await CHATTING__CONVERSATION_MODEL.insert({ name, description, receiverID, authorID });

            let infoUser            = await USER_MODEL.findById(userID);
            if(infoConversation.error){
                return 
            }
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { message  : 'hello'}, event :'SSC_NEW_CONVERSATION', io})
            // mapSocketIDAndData(arrReceiver, 'SSC_NEW_CONVERSATION',  {  infoConversation, infoUser,  chatPrivate : true }, io)
        }

        if(!chatPrivate){
            let infoConversation    = await CHATTING__CONVERSATION_MODEL.insertConversationMoreTowMember({ name, description, receivers, authorID });
            if(infoConversation.error){
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data : { message :  infoConversation.error }, event :'SSC_NEW_CONVERSATION', io})
                return 
            }
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { infoConversation, inforUser : 'infoUser'}, event :'SSC_NEW_CONVERSATION', io})

        }
    },
    
    // Sửa tên cuộc hội thoại [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_UPDATE_INFO_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        // let listUserActive              = socket.$service.listUserConnected;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let {   conversationID, receivers, name } = data;
        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }
        if( conversationID ){
            let infoAfterUpdate = await CHATTING__CONVERSATION_MODEL.updateByID({ name, conversationID, userID});
            if(!infoAfterUpdate.error){
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data :{  name, userID, infoConversation : infoAfterUpdate }, event :'SSC_UPDATE_INFO_CONVERSATION', io})
                // let content = `${name}`;
                // let status = 102;// trạng thái tin nhắn thông báo cho cả nhốm vf: user1 vừa bị xóa
                // let infoMessageAfterInsert = await DB_CHATTING__MESSAGE_MODEL.insert(
                // { senderID: userID , content, receivers , conversationID, status });
                // arrReceiver.forEach(async receive =>{
                //     if(receive != userID ){
                //         let content = `${infoAfterUpdate.oldName}`;
                //         let infoAddNotification =  await DB_NOTIFICATION.insert({ sender : userID, receiver : receive , content, type : MESSAGE_UPDATE_INFO_CONVERSATION , url:'/message/home' })
                //     }
                // });
            }
        }
    },

    // Thêm người vào cuộc hội [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_ADD_MEMBER_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let {  members, conversationID, receivers } = data; 

        let authorID     = userID;
        let infoAfterAdd = await CHATTING__CONVERSATION_MODEL.addMembersToConversionByID({ members, conversationID, authorID  });
   
        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        };

        let arrNewMember = [];
        if(members && members.includes(',')) {
            arrNewMember = members.split(',');
        } else {
            arrNewMember.push(members);
        };
        arrReceiver = [...arrReceiver, ...arrNewMember];

        console.log({infoAfterAdd, arrReceiver})
        if(!infoAfterAdd.error){
            let arrInforMember = [];
            let infoConversation = await CHATTING__CONVERSATION_MODEL.getInfoByID({ conversationID, userID : authorID  });
            let infoConversationClone = infoConversation;
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { arrNewMember : members, conversationID }, event :'SSC_ADD_MEMBER_CONVERSATION', io })
        }
    },

    // Xoá thành viên khỏi cuộc hội thoại(chỉ áp dụng cho cuộc hội thoại hai người) [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_KICK_MEMBER_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;

        let {  memberID, conversationID, receivers, nameMemberDelete } = data;
        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }

        if(!nameMemberDelete){
            nameMemberDelete = `user ${userID}`
        }
        let newArrReceiver = [...arrReceiver];
        let indexUserDelete = newArrReceiver.indexOf(memberID);
        newArrReceiver.splice(indexUserDelete, 1)
        let newStringReceiver = newArrReceiver.toString();

        if(memberID && conversationID ){
            let resulKickMember = await CHATTING__CONVERSATION_MODEL.removeMembersFromConversionByID({ members : memberID, conversationID, authorID : userID });
            console.log({resulKickMember})
            if(!resulKickMember.error){
                let content = `${nameMemberDelete}`;
                let status = 101;// trạng thái tin nhắn thông báo cho cả nhốm vf: user1 vừa bị xóa
                let infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insert( { senderID: userID , content, receivers: newStringReceiver , conversationID, status });

               return sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { infoMessageAfterInsert }, event :'SSC_KICK_MEMBER_CONVERSATION', io})
            }
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : [userID] , data : { message : '404 fobbiden' }, event :'SSC_KICK_MEMBER_CONVERSATION', io})

        }
    },

    //================================================================ MESSAGE================================================================
   
    // Gửi tin nhắn  [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_SEND_MESSAGE]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        let userID                      = socket.client.user;
        
        let { tempID, content, receivers, conversationID, messageID, isLikeIcon, isShareMessage, messageShareID } = data;
        

        if(!content){
            content = 'Tin nhắn mẫu'
        }

        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }

      
        async function addMessage(){
            let infoMessageAfterInsert;
            if(!isLikeIcon){
                // II.2.4. Chia sẽ tin nhắn
                if(isShareMessage){

                    //infoMessageShare
                    infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.copyMessage({ senderID: userID , receivers , conversationID, messageShareID });
                }else{

                // II.2.1. Tin nhắn thường
                // II.2.2. Tin nhắn reply
                    infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insert({ senderID: userID , content, receivers , conversationID } );
                    links = getLinkFromStringV1(content);
                }
            }else{

                // II.2.3. Gửi nút like
                infoMessageAfterInsert = await CHATTING__MESSAGE_MODEL.insert({ senderID: userID , content, receivers , conversationID, status : 107 });
            }

            infoConversation = await CHATTING__CONVERSATION_MODEL.getInfoByID({ conversationID, userID });

            // II.2.5 Tổng hợp link cuộc hội thoại nếu có gửi link
            if(links && links.length){
                let infoConversationAfterInsertLinks = await CHATTING__CONVERSATION_MODEL.updateLinks({ conversationID, userID, links });
            }

            // II.2.6 Nếu thành công gửi socket và clouding 
            if(!infoMessageAfterInsert.error) {
                let messageID = infoMessageAfterInsert.data._id;
                let infoMessage = await CHATTING__MESSAGE_MODEL.getInfoByID({ messageID });
                let objData = links && links.length ? { tempID, infoMessage, userID, infoConversation, isLikeIcon, receivers, links } : { tempID, infoMessage, userID, infoConversation, isLikeIcon, receivers };
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data : { infoConversation , infoMessageAfterInsert }, event :'SSC_SEND_MESSAGE', io})

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
            }
        }
        //II.1 Gửi tin nhắn chứa file đínnh kèm
        if(messageID && messageID.length > 0){
            console.log("Coding")
            // addMesaageWithFile();
        }else{
        //II.2
            // Gửi tin nhắn bình thường
            // Có các trạng thái :
            // II.2.1. Tin nhắn thường
            // II.2.2. Tin nhắn reply
            // II.2.3. Gửi nút like
            // II.2.4. Chia sẽ tin nhắn
            addMessage();
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

    // Đang soạn tin  nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_TYPING_MESAGE]: async function(data, ack) { // write your handler function here.
        let socket                                          = this;
        let listUserActive                                  = socket.$service.listUserConnected2;
        let userID                                          = socket.client.user;
        let { typing, receivers, conversationID }           = data;
        let arrReceiver                                     = [];
        let  io                                             = socket.$service.io;
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }

        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { typing, conversationID, user : userID }, event :'SSC_TYPING_MESSAGE', io})
        // let inforUpdateUserMissMess =  await CHATTING__CONVERSATION_MODEL.updateUserMissMessage({ conversationID, userID, isRep : true })
        // let infoUpdateTyping        =  await CHATTING__CONVERSATION_MODEL.updateMessageTyping({ conversationID, userID, content });
    },

    // Đã nhận tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_RECEIVED_MESSAGE]: async function(data, ack) { // write your handler function here.
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let { messageID  , conversationID, receivers }  = data;
        let arrReceiver                                 = [];
        let  io                                         = socket.$service.io;

        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }

        // Cập nhật trạng thái đã nhận tin nhắn.
        let infoUpdate = await CHATTING__MESSAGE_MODEL.updateRecive({ messageID });
        if(!infoUpdate.error){
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  {  messageID  , conversationID }, event :'SSC_RECEIVER_MESSAGE', io})
        }
    },

    // Đã xem tin nhắn [done]
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_SEEN_MESSAGE]: async function(data, ack) { // write your handler function here.
        let socket                                      = this;
        let listUserActive                              = socket.$service.listUserConnected2;
        let  io                                         = socket.$service.io;
        let authorID                                    = socket.client.user;
        let { messageID  , conversationID , receivers } = data;

        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }
        
        let _inforUpdateMiss  =   CHATTING__CONVERSATION_MODEL.updateUserMissMessage({ conversationID, userID, isRep : true });
        let _infoMessage      =   CHATTING__MESSAGE_MODEL.getInfoByID({messageID})
        let { inforUpdateMiss,  infoMessage } = await promise.all([ inforUpdateMiss, infoMessage ])
        if(messageID && ! infoMessage.error)
            return;

        let inforUpdate =  await CHATTING__MESSAGE_MODEL.seenMessageOneByOne({ messageID, userID :userID });
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { authorID, conversationID, infoConversation: inforUpdateMiss, infoMesage : infoMessage }, event :'SSC_SEEN_MESSAGE', io})
    },
    
}