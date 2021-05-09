// const SwaggerService = require("swagger-moleculer");
let { CF_ACTIONS_ACCOUNT } 	= require('../config/constants/actions');
let { 
	CF_ROUTINGS_ACCOUNT,
} 							= require('../config/constants/routings');

module.exports = {
	// mixins: [SwaggerService],
	name: "swagger-user",
	settings: {
		schemas: {
            Account: {
                type: "object",
                properties: {
					email: {
						type: "email",
					},
					password: {
						type: "password",
					},
					firstName: {
						type: "string",
					},
					lastName: {
						type: "string",
					},
                    token: {
						type: "string"
					}
                }
            },
        },
		routes: [
			{
				// path: "/api",
				aliases: {

					// cấu hình demo trước một vài route
					[`GET ${CF_ROUTINGS_ACCOUNT.ORIGIN_APP}`]: {
						swaggerDoc: {
                            summary: "Get list account",
							tags: ["Account"],
							description: "Get list account",
							parameters: []
						},
						action:  CF_ACTIONS_ACCOUNT.GET_LIST
					},
					
					[`POST ${CF_ROUTINGS_ACCOUNT.LOGIN}`]:{
						swaggerDoc: {
                            tags: ["Account"],
                            summary: ["Add a new pet to the store"],
                            description: "Login account",
							parameters: [
                                {
									in: "query",
									name: "email",
									type: "string",
									description: "",
									required: true,
									schema: {}
								},
								{
									in: "query",
									name: "password",
									type: "password",
									description: "",
									required: true,
									schema: {}
								}
                            ],
                            // responses: [

                            // ]
						},
						action:  CF_ACTIONS_ACCOUNT.LOGIN
					},
					
                    [`POST ${CF_ROUTINGS_ACCOUNT.REGISTER}`]:{
						swaggerDoc: {
                            tags: ["Account"],
                            summary: ["Add a new pet to the store"],
                            description: "Register account",
							parameters: [
                                {
									in: "query",
									name: "email",
									type: "string",
									description: "",
									required: true,
									schema: {}
								},
								{
									in: "query",
									name: "password",
									type: "password",
									description: "",
									required: true,
									schema: {}
								},
								{
									in: "query",
									name: "fullName",
									type: "password",
									description: "",
									required: true,
									schema: {}
								}
                            ],
                            // responses: [

                            // ]
						},
						action:  CF_ACTIONS_ACCOUNT.REGISTER
					},
					
					[`POST /account/{accountID}`]:{
						swaggerDoc: {
                            tags: ["Account"],
                            summary: ["Add a new pet to the store"],
                            description: "Update info account by id",
							parameters: [
								
                                {
									in: "path",
									name: "accountID",
									type: "string",
									description: "",
									type: "integer",
									format: "int64",
									required: true,
									schema: {}
								},
								{
									in: "params",
									name: "fullName",
									type: "string",
									description: "",
									required: true,
									schema: {}
								}
                            ],
                            // responses: [

                            // ]
						},
						action:  CF_ACTIONS_ACCOUNT.UPDATE_INFO
					},
                   
                },
                
            },
		],


	},
	
};