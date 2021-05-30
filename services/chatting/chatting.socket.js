//
const { EVENT_SOCKET_CONSTANT_CHATTING } = require('./helper/chatting.events.socket-constant');

//TOOL
const  { sendDataToMultilSocketsOfListUser } = require('../../tools/socket/index.js')
const  { getLinkFromStringV1 } = require('../../tools/utils/utils.js')

// MODEL
const  USER_MODEL = require('../../services/auth/model/auth.user-model').MODEL;
const  MESSAGE_MESSAGE_MODEL = require('./model/chatting.message-model').MODEL;
const  MESSAGE_CONVERSATION_MODEL = require('./model/chatting.conversation-model').MODEL;


exports.CHATTING_SOCKET = {

    [EVENT_SOCKET_CONSTANT_CHATTING.HELLO_WORLD]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        // let listUserActive              = socket.$service.listUserConnected;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;
        
        // console.log({____________2 : socket.$service.io.to })
        // author : HUYNHVINH
        // FUNCTION MAP DATA TO SEND SOCKET: SERVER SEND TO CLIENT
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : ['user1', 'user2'], data : { message  : 'hello'}, event :'LOGIN_SUCCESS', io})
    },

    //================================================================CONVERSATION================================================================
    // Tạo cuộc hội thoại mới
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_NEW_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let userID                      = socket.$service.userID;
        let io                          = socket.$service.io;

        let { name, description,  receivers, chatPrivate } = data;

        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }   
        if(!arrReceiver.length){
            arrReceiver =  ['user1', 'user2']
        }

        if(!receivers){
            receivers       = '5e60f0f391e6794c8e131907,5e60f58cf63b8a4e196a1942,5f753908bf2ccc031f8d17ed';
        }

        // if(!authorID){
            authorID        = '5e60f58cf63b8a4e196a1942';
        // }
        if(chatPrivate){
            // let infoConversation    = await MESSAGE_CONVERSATION_MODEL.getInfoByID({ conversationID, userID });
            let infoConversation    = await MESSAGE_CONVERSATION_MODEL.insert({ name, description, receiverID, authorID });

            let infoUser            = await USER_MODEL.findById(userID);
            if(infoConversation.error){
                return 
            }
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : ['user1', 'user2'], data : { message  : 'hello'}, event :'SSC_NEW_CONVERSATION', io})
            // mapSocketIDAndData(arrReceiver, 'SSC_NEW_CONVERSATION',  {  infoConversation, infoUser,  chatPrivate : true }, io)
        }

        if(!chatPrivate){
            let infoConversation    = await MESSAGE_CONVERSATION_MODEL.insertConversationMoreTowMember({ name, description, receivers, authorID });
            if(infoConversation.error){
                return 
            }M
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { infoConversation, inforUser : 'infoUser'}, event :'SSC_NEW_CONVERSATION', io})


        }
    },
    
    // Sửa tên cuộc hội thoại
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_UPDATE_INFO_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        // let listUserActive              = socket.$service.listUserConnected;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;

        let {authorID, authorFullName, conversationID, receivers, name } = data;
        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }
        if( conversationID ){
            let infoAfterUpdate = await MESSAGE_CONVERSATION_MODEL.updateByID({ name, conversationID, userID});
            if(!infoAfterUpdate.error){
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : ['user1', 'user2'], data :{ authorID, authorFullName, name, userID, infoConversation : infoAfterUpdate }, event :'SSC_UPDATE_INFO_CONVERSATION', io})
                // let content = `${name}`;
                // let status = 102;// trạng thái tin nhắn thông báo cho cả nhốm vf: user1 vừa bị xóa
                // let infoMessageAfterInsert = await DB_MESSAGE_MESSAGE_MODEL.insert(
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
    // Thêm người vào cuộc hội 
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_ADD_MEMBER_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;

        let { authorID, authorFullName, members, conversationID, receivers, conversationName } = data; 


        authorID        = '5e60f58cf63b8a4e196a1942';
        conversationID  = '60b32f48c9d295a206e56137'
        let infoAfterAdd = await MESSAGE_CONVERSATION_MODEL.addMembersToConversionByID({ members, conversationID, authorID  });
   
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

        if(!infoAfterAdd.error){
            let arrInforMember = [];
            let infoConversation = await MESSAGE_CONVERSATION_MODEL.getInfoByID({ conversationID, userID : authorID  });
            let infoConversationClone = infoConversation;
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver : ['user1', 'user2'], data : { arrNewMember : members, conversationID }, event :'SSC_ADD_MEMBER_CONVERSATION', io})
        }
    },

    // Xoá thành viên khỏi cuộc hội thoại(chỉ áp dụng cho cuộc hội thoại hai người)
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_KICK_MEMBER_CONVERSATION]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                          = socket.$service.io;

        let { authorFullName, authorID, memberID, conversationID, receivers, nameMemberDelete, conversationName } = data;
        let arrReceiver = [];
        if(receivers && receivers.includes(',')) {
            arrReceiver = receivers.split(',');
        } else {
            arrReceiver.push(receivers);
        }

        if(!arrReceiver.length){
            arrReceiver =  ['user1', 'user2']
        }

        if(!receivers){
            receivers       = '5e60f0f391e6794c8e131907,5e60f58cf63b8a4e196a1942,5f753908bf2ccc031f8d17ed';
        }

        // if(!authorID){
        userID        = '5e60f58cf63b8a4e196a1942';
        // }
        conversationID  = '60b32f48c9d295a206e56137'
      
        let newArrReceiver = [...arrReceiver];
        let indexUserDelete = newArrReceiver.indexOf(memberID);
        newArrReceiver.splice(indexUserDelete, 1)
        let newStringReceiver = newArrReceiver.toString();

        if(memberID && conversationID ){
            let resulKickMember = await MESSAGE_CONVERSATION_MODEL.removeMembersFromConversionByID({ members : memberID, conversationID, authorID : userID });
            if(!resulKickMember.error){
                let content = `${nameMemberDelete}`;
                let status = 101;// trạng thái tin nhắn thông báo cho cả nhốm vf: user1 vừa bị xóa
                let infoMessageAfterInsert = await MESSAGE_MESSAGE_MODEL.insert(
                    { senderID: userID , content, receivers: newStringReceiver , conversationID, status });

                arrReceiver =  ['user1', 'user2']
                sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver , data : { infoMessageAfterInsert }, event :'SSC_KICK_MEMBER_CONVERSATION', io})
            }
        }
    },

    //================================================================ MESSAGE================================================================
   
    // Gửi tin nhắn 
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_SEND_MESSAGE]: async function(data, ack) { // write your handler function here.
        let socket                      = this;
        let socketID                    = socket.id;
        let listUserActive              = socket.$service.listUserConnected2;
        let io                         = socket.$service.io;
        
        let { tempID, content, receivers, conversationID, messageID, isLikeIcon, isShareMessage, messageShareID } = data;
        

        // FAKE user : 
        // fake tin nhắn text
        conversationID  = '5f82989eeb808f7b513f220d';
        userID          = '5e60f58cf63b8a4e196a1942';
        if(!content){
            content = 'Tin nhắn mẫu'
        }
        if(!receivers){
            receivers     = '5e60f0f391e6794c8e131907,5e60f58cf63b8a4e196a1942';
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
                    infoMessageAfterInsert = await MESSAGE_MESSAGE_MODEL.copyMessage({ senderID: userID , receivers , conversationID, messageShareID });
                }else{

                // II.2.1. Tin nhắn thường
                // II.2.2. Tin nhắn reply
                    infoMessageAfterInsert = await MESSAGE_MESSAGE_MODEL.insert({ senderID: userID , content, receivers , conversationID } );
                    links = getLinkFromStringV1(content);
                }
            }else{

                // II.2.3. Gửi nút like
                infoMessageAfterInsert = await MESSAGE_MESSAGE_MODEL.insert({ senderID: userID , content, receivers , conversationID, status : 107 });
            }
            console.log({infoMessageAfterInsert})

            infoConversation = await MESSAGE_CONVERSATION_MODEL.getInfoByID({ conversationID, userID });
            arrReceiver     = ['5e60f58cf63b8a4e196a1942', '5e60f0f391e6794c8e131907', 'user1', 'user2'];

            // II.2.5 Tổng hợp link cuộc hội thoại nếu có gửi link
            if(links && links.length){
                let infoConversationAfterInsertLinks = await MESSAGE_CONVERSATION_MODEL.updateLinks({ conversationID, userID, links });
            }

            // II.2.6 Nếu thành công gửi socket và clouding 
            if(!infoMessageAfterInsert.error) {
                let messageID = infoMessageAfterInsert.data._id;
                let infoMessage = await MESSAGE_MESSAGE_MODEL.getInfoByID({ messageID });
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

    // Đang soạn tin  nhắn 
    [EVENT_SOCKET_CONSTANT_CHATTING.CSS_TYPING_MESAGE]: async function(data, ack) { // write your handler function here.
        let socket                                          = this;
        let listUserActive                                  = socket.$service.listUserConnected2;
        let { typing, reciverID, conversationID, content }  = data;
        let arrReceiver                                     = [];
        let  io                                             = socket.$service.io;
        if(reciverID && reciverID.includes(',')) {
            arrReceiver = reciverID.split(',');
        } else {
            arrReceiver.push(reciverID);
        }

        // Dữ liệu demo nếu không truyền gì cả 
        if(!reciverID){
            arrReceiver     = ['5e60f0f391e6794c8e131907', '5e60f58cf63b8a4e196a1942', 'user1', 'user2'];
        }
        if(!conversationID){
            conversationID = '5f82989eeb808f7b513f220d'
        }
        sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  { typing, conversationID, user : this.userID }, event :'SSC_TYPING_MESSAGE', io})
        // let inforUpdateUserMissMess =  await MESSAGE_CONVERSATION_MODEL.updateUserMissMessage({ conversationID, userID, isRep : true })
        // let infoUpdateTyping        =  await MESSAGE_CONVERSATION_MODEL.updateMessageTyping({ conversationID, userID, content });
    },

    // Đã nhận tin nhắn
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

        // Dữ liệu demo nếu không truyền gì cả 
        if(!receivers){
            arrReceiver     = ['5e60f0f391e6794c8e131907', '5e60f58cf63b8a4e196a1942', 'user1', 'user2'];
        }

        if(!conversationID){
            conversationID = '5f82989eeb808f7b513f220d'
        }

        if(!messageID){
            messageID = '60b3192f00fbf39adda1fb3b'
        }
        // Cập nhật trạng thái đã nhận tin nhắn.
        let infoUpdate = await MESSAGE_MESSAGE_MODEL.updateRecive({ messageID });
        if(!infoUpdate.error){
            sendDataToMultilSocketsOfListUser({ listUserConnected : listUserActive, arrReceiver, data :  {  messageID  : 'messageDemo', conversationID :'conversationID' }, event :'SSC_RECEIVER_MESSAGE', io})
        }
    },
    
}