"use strict";
/**
 * MIDDLEWARE
 */
let { 
	CHECK_AUTHENCATION,
	CHECK_AUTHORIZATION,
} 							= require('./auth');
let { 
	CF_ROUTINGS, 
	CF_ROUTINGS_PRODUCTS,
	CF_ROUTINGS_CATEGORIES,
} 							= require('../../constants/routings');
let { 
	CF_ACTIONS,
    CF_ACTIONS_PRODUCTS,
	CF_ACTIONS_CATEGORIES,
} 									= require('../../constants/actions');
const { CF_SERVICES } 				= require('../../constants/services');

module.exports = {
	path: CF_ROUTINGS.API,

	// authentication: true,
	// authorization: true,

	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------categories--------------------------//

		[`GET ${CF_ROUTINGS_CATEGORIES.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.GET_LIST}`],

		[`POST ${CF_ROUTINGS_CATEGORIES.ORIGIN_APP}`] : 
		[CHECK_AUTHORIZATION, `${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.CREATE}`],

		[`GET ${CF_ROUTINGS_CATEGORIES.REMOVE}`] : 
		[CHECK_AUTHORIZATION,`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.REMOVE}`],
	
		//---------------------------products--------------------------//
		[`GET ${CF_ROUTINGS_PRODUCTS.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.GET_LIST}`],

		[`POST ${CF_ROUTINGS_PRODUCTS.ORIGIN_APP}`] : 
		[CHECK_AUTHORIZATION, `${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.CREATE}`],

		[`GET ${CF_ROUTINGS_PRODUCTS.FIND_BY_ID}`] : 
		[CHECK_AUTHORIZATION, `${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.FIND_BY_ID}`],

		[`POST ${CF_ROUTINGS_PRODUCTS.ADD_TO_CART}`] : 
		[CHECK_AUTHENCATION, `${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.ADD_TO_CART}`],

		[`GET ${CF_ROUTINGS_PRODUCTS.SHOW_CART}`] : 
		[CHECK_AUTHENCATION, `${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.SHOW_CART}`],

		[`GET ${CF_ROUTINGS_PRODUCTS.REMOVE}`] : 
		[CHECK_AUTHORIZATION, `${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.REMOVE}`],

	},

	
	// Disable to call not-mapped actions
	mappingPolicy: "all", // Available values: "all", "restrict"

	// Set CORS headers
	//cors: true,

	// Parse body content
	bodyParsers: {
		json: {
			strict: false,
		},
		urlencoded: {
			extended: true,
			limit: "1MB"
		}
	},
	// Enable/disable logging
	logging: true
};
