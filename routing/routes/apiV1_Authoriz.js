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

		//--------------------------account--------------------------//

		[`GET ${CF_ROUTINGS_ACCOUNT.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.GET_LIST}`],

		//--------------------------app--------------------------//

		// /app/create-app ( demo tạo app )
		[`POST ${CF_ROUTINGS_ACCOUNT.CREATE_APP}`] : 
		[  `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.CREARE_APP}`],

		// /app/update-app/:appID ( demo update app )
		[`POST ${CF_ROUTINGS_ACCOUNT.UPDATE_APP}`] : 
		[  `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.UPDATE_APP}`],

		
		// /app/add-user-app ( demo add user in app )
		[`POST ${CF_ROUTINGS_ACCOUNT.ADD_USER_APP}`] : 
		[  `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.INSER_MEMBER_IN_APP}`],

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
