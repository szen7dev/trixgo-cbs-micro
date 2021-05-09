"use strict";
/**
 * MIDDLEWARE
 */
let { 
	CHECK_AUTHENCATION,
	CHECK_AUTHORIZATION,
	CHECK_AUTHORIZATION_ADMIN
} 							= require('../role/_mid.check');
let { 
	CF_ROUTINGS, 
	CF_ROUTINGS_ACCOUNT,
	CF_ROUTINGS_PRODUCTS,
	CF_ROUTINGS_POSTS,
	CF_ROUTINGS_CATEGORIES,
} 							= require('../../config/constants/routings');
let { 
	CF_ACTIONS,
    CF_ACTIONS_ACCOUNT,
    CF_ACTIONS_PRODUCTS,
    CF_ACTIONS_POSTS,
	CF_ACTIONS_CATEGORIES,
	CF_ACTIONS_CRONJOB
} 							= require('../../config/constants/actions');
module.exports = {
	path: CF_ROUTINGS.API,

	// authentication: true,

	authorization: true,
	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------account--------------------------//

		[`GET ${CF_ROUTINGS_ACCOUNT.ORIGIN_APP}`] : 
		[ CHECK_AUTHORIZATION,`${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.GET_LIST}`],

		[`POST ${CF_ROUTINGS_ACCOUNT.REGISTER}`] : 
		[`${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.REGISTER}`],

		[`POST ${CF_ROUTINGS_ACCOUNT.LOGIN}`] : 
		[`${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.LOGIN}`],

		[`GET ${CF_ROUTINGS_ACCOUNT.LOGOUT}`] : 
		[`${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.LOGOUT}`],

		[`POST  ${CF_ROUTINGS_ACCOUNT.UPDATE_INFO}`] : 
		[ CHECK_AUTHENCATION, `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.UPDATE_INFO}`],

		// /api/create-app ( demo tạo app )
		[`POST ${CF_ROUTINGS_ACCOUNT.CREATE_APP}`] : 
		[ CHECK_AUTHORIZATION_ADMIN, `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.CREARE_APP}`],

		// /api/update-app/:appID ( demo update app )
		[`POST ${CF_ROUTINGS_ACCOUNT.UPDATE_APP}`] : 
		[ CHECK_AUTHORIZATION_ADMIN, `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.UPDATE_APP}`],

		
		// /api/add-user-app ( demo add user in app )
		[`POST ${CF_ROUTINGS_ACCOUNT.ADD_USER_APP}`] : 
		[ CHECK_AUTHORIZATION_ADMIN, `${CF_ACTIONS.ACCOUNT}.${CF_ACTIONS_ACCOUNT.INSER_MEMBER_IN_APP}`],

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

		//---------------------------post--------------------------//

		[`GET ${CF_ROUTINGS_POSTS.ORIGIN_APP}`] : 
		[`${CF_ACTIONS.POSTS}.${CF_ACTIONS_POSTS.GET_LIST}`],

		[`POST ${CF_ROUTINGS_POSTS.ORIGIN_APP}`] : 
		[CHECK_AUTHENCATION, `${CF_ACTIONS.POSTS}.${CF_ACTIONS_POSTS.CREATE}`],

		[`POST ${CF_ROUTINGS_POSTS.ADD_COMMENT}`] : 
		[CHECK_AUTHENCATION, `${CF_ACTIONS.POSTS}.${CF_ACTIONS_POSTS.ADD_COMMENT}`],

		[`POST ${CF_ROUTINGS_POSTS.REMOVE_COMMENT}`] : 
		[CHECK_AUTHENCATION, `${CF_ACTIONS.POSTS}.${CF_ACTIONS_POSTS.REMOVE_COMMENT}`],

		// remove post
		[`POST ${CF_ROUTINGS_POSTS.REMOVE}`] : 
		[CHECK_AUTHENCATION, `${CF_ACTIONS.POSTS}.${CF_ACTIONS_POSTS.REMOVE}`],

		//---------------------------cart--------------------------//
		"GET /cart": [CHECK_AUTHENCATION, "cart.me"],
		"POST /cart": [CHECK_AUTHENCATION, "cart.add"],

		//---------------------------oder--------------------------//
		"GET /order": [CHECK_AUTHENCATION, "order.me"],
		"POST /order": [CHECK_AUTHENCATION, "order.create"],
		//---------------------------cron - job--------------------------//

		[`POST ${CF_ROUTINGS.CRON_JOB}`] : 
		[CHECK_AUTHORIZATION,`${CF_ACTIONS.CRON_JOB}.${CF_ACTIONS_CRONJOB.ADD_CRON}`],


		// 'GET /openapi.json': 'openapi.generateDocs', // swagger scheme
		 // 'GET /ui': 'openapi.ui', // ui

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
