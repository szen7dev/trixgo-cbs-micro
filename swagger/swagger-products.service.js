// const SwaggerService = require("swagger-moleculer");
let { CF_ACTIONS_PRODUCTS } 	= require('../config/constants/actions');
module.exports = {
	// mixins: [SwaggerService],
	name: "swagger-products",
	settings: {
		schemas: {
            Products: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                    },
                    name: {
                        type: "string",
                    },
                    price: {
                        type: "number",
					},
					amout: {
                        type: "number",
					},
					status: {
                        type: "number",
					}
                }
            },
        },
		routes: [
			{
				
				aliases: {

					"GET /products": {
						swaggerDoc: {
							tags: ["Products"],
							description: "Get list products",
							parameters: []
						},
						action: CF_ACTIONS_PRODUCTS.GET_LIST
					},

					// "POST /products": {
					// 	swaggerDoc: {
					// 		tags: ["products"],
					// 		description: "Create new product",
					// 		parameters: [ 
					// 			{
					// 				in: "query",
					// 				name: "name",
					// 				type: "string",
					// 				description: "",
					// 				required: true,
					// 				schema: {}
					// 			},
					// 			{
					// 				in: "query",
					// 				name: "price",
					// 				type: "number",
					// 				description: "",
					// 				required: true,
					// 				schema: {}
					// 			},
					// 		]
					// 	},
					// 	action: "products.create"
					// },

					"GET /products/:id": {
						swaggerDoc: {
							tags: ["Products"],
							description: "Get product by id product",
							parameters: [
								{
									in: "path",
									name: "id",
									type: "string",
									description: "",
									type: "integer",
									format: "int64",
									required: true,
									schema: {}
								},
							]
						},
						action: CF_ACTIONS_PRODUCTS.FIND_BY_ID
					},
                   
                },
                
			},
		],
		
	}
};