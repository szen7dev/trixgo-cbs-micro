"use strict";

let { 
	CF_ROUTINGS, 
	CF_ROUTINGS_ACCOUNT,
	CF_ROUTINGS_PRODUCTS,
	CF_ROUTINGS_CATEGORIES,
} 							= require('../../config/constants/routings');
let { 
	CF_ACTIONS,
    CF_ACTIONS_ACCOUNT,
    CF_ACTIONS_PRODUCTS,
	CF_ACTIONS_CATEGORIES,
	CF_ACTIONS_CRONJOB
} 							= require('../../config/constants/actions');
module.exports = {
	path: CF_ROUTINGS.MAIN,

	authentication: true,

	authorization: true,

	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------categories--------------------------//

		[`POST ${CF_ROUTINGS_CATEGORIES.ORIGIN_APP}`] : 
		[ `${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.CREATE}`],

		[`GET ${CF_ROUTINGS_CATEGORIES.REMOVE}`] : 
		[`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.REMOVE}`],
	
		//---------------------------products--------------------------//

		[`POST ${CF_ROUTINGS_PRODUCTS.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.CREATE}`],

		[`GET ${CF_ROUTINGS_PRODUCTS.FIND_BY_ID}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.FIND_BY_ID}`],


		[`GET ${CF_ROUTINGS_PRODUCTS.REMOVE}`] : 
		[`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.REMOVE}`],

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
