"use strict";
/**
 * MIDDLEWARE
 */
let { 
	CF_ROUTINGS, 
	CF_ROUTINGS_PRODUCTS,
} 							= require('../../config/constants/routings');
let { 
	CF_ACTIONS,
    CF_ACTIONS_PRODUCTS,
} 							= require('../../config/constants/actions');
module.exports = {
	path: CF_ROUTINGS.MAIN,

	authentication: true,

	authorization: false,
	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------categories--------------------------//

		//---------------------------products--------------------------//

		[`POST ${CF_ROUTINGS_PRODUCTS.ADD_TO_CART}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.ADD_TO_CART}`],

		[`GET ${CF_ROUTINGS_PRODUCTS.SHOW_CART}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.SHOW_CART}`],

		//---------------------------cron - job--------------------------//

		"GET test"	: "test.actionTest",

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
