module.exports = {
    // CHATTING
    // code  :chatting_1
    // Lấy danh sách cuộc hội thoại
    "GET /chatting/conversations/users/:userID": {
        swaggerDoc: {
            tags: ["message"],
            description: "Get list conversation of user",
            parameters: [
                {
                    in: "query",
                    name: "currentPage",
                    type: "string",
                    description: "",
                    required: true,
                    schema: {
                        name:{
                            type: "string",
                        }
                    }
                },

            ]
        },
        action: "message.ACT_CHATTING_CONVERSATION_GET_LIST_CONVERSATION_BY_USER_ID"
    },

    // Tìm kiến tên tên cuộc hội thoại
    // code : chatting_4
    "GET /message/conversation/getListConversationByKey": {
        swaggerDoc: {
            tags: ["message"],
            description: "find conversation with name",
            parameters: [{
                key : 'string'
            }]
        },
        action: "message.ACT_CHATTING_CONVERSATION_GET_LIST_CONVERSATION_WITH_KEY"
    },

    // Lấy thông tin cuộc hội thoại
    // code : chatting_info_conversation
    "GET /message/conversation/getListConversationById": {
        swaggerDoc: {
            tags: ["message"],
            description: "get info conversation by userID",
            parameters: [{
                conversationID  : 'string'
            }]
        },
        action: "message.ACT_CHATTING_CONVERSATION_GET_INFO_CONVERSATION_BY_ID"
    },

    // Xem các tệp của cuộc hội thoại [****** để sau]

    // Danh sách bạn bè để thêm vào cuộc hội thoại ----> lấy từ api lấy thông tin user 

    // Lây tin nhắn của cuộc hội thoại phân trang 30 mẫu tin
    //code : chatting_info_conversation
    "GET /message/message/getListMessageByConversationId": {
        swaggerDoc: {
            tags: ["message"],
            description: "get message of conversation",
            parameters: [{
                conversationID  : 'string'
            }]
        },
        action: "message.ACT_CHATTING_MESSAGE_GET_LIST_MESSAGE_BY_CONVERSATION_ID"
    },

    // Tìm kiếm tinh nhắn trong một cuộc hội thoại [******** để sau]
}