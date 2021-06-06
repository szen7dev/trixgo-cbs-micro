const { CF_ROUTINGS_CHATTING } = require('./chatting.routes-constant');

module.exports = {
    
    // CHATTING
    //code  :chatting_1
    // Lấy danh sách cuộc hội thoại
    [`GET /chatting/conversations/users/{userID}`]: {
        swaggerDoc: {
            tags: ["message"],
            description: "Get list conversation of user",
            parameters: [
                {
                    in: "query",
                    name: "currentPage",
                    type: "string",
                    required: true,
                    schema: {
                        currentPage:{
                            type: "string",
                        }
                    }
                },
                {
                    in: "path",
                    name: "userID",
                    type: "string",
                    required: true,
                    schema: {
                        userID:{
                            type: "string",
                        }
                    }
                },
        ]	,
        },
        action: "message.ACT_CHATTING_CONVERSATION_GET_LIST_CONVERSATION_BY_USER_ID"
    },

    // Tìm kiến tên tên cuộc hội thoại
    // code : chatting_search_conversation_key
    [`GET ${ CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_BY_KEY }`]: {
        swaggerDoc: {
            tags: ["message"],
            description: "find conversation with name",
            parameters: [{
                in: "query",
                name: "key",
                type: "string",
                required: true,
                schema: {
                    key:{
                        type: "string",
                    }
                }
            }]
        },
        action: "message.ACT_CHATTING_CONVERSATION_GET_LIST_CONVERSATION_WITH_KEY"
    },

    // Lấy thông tin cuộc hội thoại
    // code : chatting_info_conversation
    [`GET /chatting/conversations/{conversationID} `]: {
        swaggerDoc: {
            tags: ["message"],
            description: "get info conversation by ID limit 15 page",
            parameters: [{
                in: "path",
                name: "conversationID",
                type: "string",
                required: true,
                schema: {
                    conversationID:{
                        type: "string",
                    }
                }
            }]
        },
        action: "message.ACT_CHATTING_CONVERSATION_GET_INFO_CONVERSATION_BY_ID"
    },

    // Xem các tệp của cuộc hội thoại [****** để sau]

    // Danh sách bạn bè để thêm vào cuộc hội thoại ----> lấy từ api lấy thông tin user 

    // Lây tin nhắn của cuộc hội thoại phân trang 30 mẫu tin
    //code : chatting_info_conversation
    [`GET /chatting/messages/conversations/{conversationID}`]: {
        swaggerDoc: {
            tags: ["message"],
            description: "get message of conversation",
            parameters: [
                {
                    in: "path",
                    name: "conversationID",
                    type: "string",
                    required: true,
                    schema: {
                        conversationID:{
                            type: "string",
                        }
                    }
                },
                {
                    in: "query",
                    name: "currentPage",
                    type: "string",
                    required: true,
                    schema: {
                        currentPage:{
                            type: "string",
                        }
                    }
                },

            ]
        },
        action: "message.ACT_CHATTING_MESSAGE_GET_LIST_MESSAGE_BY_CONVERSATION_ID"
    },

    // Tìm kiếm tinh nhắn trong một cuộc hội thoại [******** để sau]

}