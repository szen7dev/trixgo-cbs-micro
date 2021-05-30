const SwaggerService = require("swagger-moleculer");

module.exports = {
	// Service name
	mixins: [SwaggerService],
	name: "swagger",
	settings: {
		middleware: false,
		port: 3002,
		ip: "0.0.0.0",
		expose: true,
		swagger: {
			info: {
				description: "CBS's APIs Document",
				version: "1.0.0",
				title: "CBS's APIs Document",
				termsOfService: "",
				contact: {
					name: "khanhney",
					url: "https://github.com/khanhney",
					email: "khanhney.dev@gmail.com"
				},
				license: {
					name: "Apache 2.0",
					url: "https://www.apache.org/licenses/LICENSE-2.0.html"
				}
			},
			host: "127.0.0.1:3002",
			basePath: "/api",
			tags: [
				{
					name: "CBS",
					description: "All APIs in CBS",
					externalDocs: {
						description: "Find out more",
						url: "http://swagger.io"
					}
				}
			],
			schemes: ["http", "https"],
			consumes: ["application/json"],
			produces: ["application/json"]
		},
		schemas: {
			name:{
				type: "string",
			}
		},
		routes: [
			{
				path: "/api",
				aliases: {
					// Admin login
					"GET /greeter/hello": {
						swaggerDoc: {
							tags: ["greeter"],
							description: "Hello Page",
							parameters: []
						},
						action: "greeter.hello"
					},
					"GET /greeter/welcome": {
						swaggerDoc: {
							tags: ["greeter"],
							description: "Welcome Page",
							parameters: [
								{
									in: "query",
									name: "name",
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
						action: "greeter.welcome"
					},

					// CHATTING
					//code  :chatting_1
					// Lấy danh sách cuộc hội thoại
					"GET /message/conversation/getListConversationByUserId": {
						swaggerDoc: {
							tags: ["message"],
							description: "Get list conversation of user",
							parameters: [{
								currentPage : 'string'
							}]
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

			}
		],
		tags: [
			{
				name: "Public",
				description: "APIs public access"
			}
		],
		servers: [
			{
				url: "http://localhost:3000/",
				description: "Develop server"
			}
		]
	}
};