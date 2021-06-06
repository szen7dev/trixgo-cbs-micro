const SwaggerService 				= require("swagger-moleculer");
const CHATTING__DOC					= require('../chatting/helper/chatting.docs-constant');

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
					...CHATTING__DOC
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
				url: "http://localhost:3003/",
				description: "Develop server"
			}
		]
	}
};