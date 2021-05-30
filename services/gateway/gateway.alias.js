"use strict";
/**
 * MIDDLEWARE
 */
const { 
	CHECK_AUTHENCATION,
	CHECK_AUTHORIZATION,
} 								= require('./auth');

const { CF_DOMAIN_SERVICES } 	= require('./helper/domain.constant');

/**
 * ------import action's Services--------
 */
const { CF_ACTIONS_AUTH } 		= require('../auth/helper/auth.actions-constant');
const { CF_ACTIONS_CHATTING } 		= require('../chatting/helper/chatting.actions-constant');

/**
 * ------import route's Services---------
 */
const { CF_ROUTINGS_AUTH } 			= require('../auth/helper/auth.routes-constant');
const { CF_ROUTINGS_CHATTING } 		= require('../chatting/helper/chatting.routes-constant');

module.exports = {
	path: 'api',

	// authentication: true,
	// authorization: true,

	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------aliases's EXAMPLE service--------------------------//
		[`GET ${CF_ROUTINGS_AUTH.INSERT_FAST}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.INSERT_FAST}`],
		//--------------------------aliases's CHATTING service--------------------------//

		//--------------------------aliases's CHATTING_CONVERSATION --------------------------//
		[`GET ${CF_ROUTINGS_CHATTING.INSERT_CONVERSATION}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.INSERT_CONVERSATION}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_BY_USER_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_BY_USER_ID}`],

		"GET message/test" : 
		"message.ACT_CHATTING_CONVERSATION_GET_LIST_CONVERSATION_BY_USER_ID",


		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_BY_KEY}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_WITH_KEY}`],
		
		[`GET ${CF_ROUTINGS_CHATTING.GET_INFO_CONVERSATION_BY_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_BY_ID}`],
		
		//--------------------------aliases's CHATTING_MESSAGE --------------------------//

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_MESSAGE_BY_CONVERSATION_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_MESSAGE_BY_CONVERSATION_ID}`],
		

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
