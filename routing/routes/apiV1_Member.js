"use strict";
/**
 * MIDDLEWARE
 */
let { 
	CF_ROUTINGS, 
	CF_ROUTINGS_PRODUCTS,
	CF_ROUTINGS_CATEGORIES,
} 							= require('../../config/constants/routings');
let { 
	CF_ACTIONS,
    CF_ACTIONS_PRODUCTS,
	CF_ACTIONS_CATEGORIES,
} 							= require('../../config/constants/actions');
module.exports = {
	path: CF_ROUTINGS.MAIN,

	authentication: false,

	authorization: false,
	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------categories-------------------------//

		[`GET ${CF_ROUTINGS_CATEGORIES.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.GET_LIST}`],

		//---------------------------products--------------------------//

		[`GET ${CF_ROUTINGS_PRODUCTS.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.GET_LIST}`],

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
