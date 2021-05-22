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
					}
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