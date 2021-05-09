"use strict";
/**
 * MIDDLEWARE
 */
let { 
	CF_ROUTINGS, 
	CF_ROUTINGS_ACCOUNT,
	CF_ROUTINGS_PRODUCTS,
	CF_ROUTINGS_POSTS,
} 							= require('../../config/constants/routings');
let { 
	CF_ACTIONS,
    CF_ACTIONS_ACCOUNT,
    CF_ACTIONS_PRODUCTS,
    CF_ACTIONS_POSTS,
	CF_ACTIONS_CRONJOB
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

		//--------------------------account--------------------------//

		[`POST  ${CF_ROUTINGS_ACCOUNT.UPDATE_INFO}`] : 
		[`${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.UPDATE_INFO}`],

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
