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
 * ------import route's Services---------
 */
const { CF_ROUTINGS_GATEWAY } 		= require('./helper/gateway.routes-constant');
const { CF_ROUTINGS_AUTH } 			= require('../auth/helper/auth.routes-constant');
const { CF_ROUTINGS_CHATTING } 		= require('../chatting/helper/chatting.routes-constant');
const { CF_ROUTINGS_PAYMENT } 		= require('../payment/helper/payment.routes-constant');

/**
 * ------import action's Services--------
 */
 const { CF_ACTIONS_GATEWAY } 		= require('./helper/gateway.actions-constant');
 const { CF_ACTIONS_AUTH } 			= require('../auth/helper/auth.actions-constant');
 const { CF_ACTIONS_CHATTING } 		= require('../chatting/helper/chatting.actions-constant');
 const { CF_ACTIONS_PAYMENT } 		= require('../payment/helper/payment.actions-constant');
 

module.exports = {
	path: 'api',
	// authentication: true,
	// authorization: true,

	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {
		//--------------------------aliases's GATEWAY service--------------------------//
		[`GET ${CF_ROUTINGS_GATEWAY.CHECK_HEALTH}`] : 
		[`${CF_DOMAIN_SERVICES.GATEWAY}.${CF_ACTIONS_GATEWAY.CHECK_HEALTH}`],

		[`GET ${CF_ROUTINGS_GATEWAY.CHECK_VERSION}`] : 
		[`${CF_DOMAIN_SERVICES.GATEWAY}.${CF_ACTIONS_GATEWAY.CHECK_VERSION}`],

		//--------------------------aliases's AUTH service--------------------------//
		[`GET ${CF_ROUTINGS_AUTH.INSERT_FAST}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.INSERT_FAST}`],

		//--------------------------aliases's CHATTING service--------------------------//
		[`GET ${CF_ROUTINGS_CHATTING.INSERT_CONVERSATION}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.INSERT_CONVERSATION}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_BY_USER_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_BY_USER_ID}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_BY_KEY}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_WITH_KEY}`],
		
		[`GET ${CF_ROUTINGS_CHATTING.GET_INFO_CONVERSATION_BY_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_BY_ID}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_MEMBER_CONVERSATION_BY_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_MEMBER_CONVERSATION_BY_ID}`],
		
		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_MESSAGE_BY_CONVERSATION_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_MESSAGE_BY_CONVERSATION_ID}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_MISS_BY_USER_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_MISS_BY_USER_ID}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_LINK_BY_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_LINKS_CONVERSATION_BY_ID}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_LIST_CONVERSATION_FILE_BY_ID}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_FILE_BY_ID}`],

		[`GET ${CF_ROUTINGS_CHATTING.GET_INFO_CONVERSATION_DRAFT}`] : 
		[`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_DRAFT}`],

		//--------------------------aliases's PAYMENT service--------------------------//
		[`GET ${CF_ROUTINGS_PAYMENT.GET_LIST_TRANSACTION}`] : 
		[`${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.GET_LIST_TRANSACTION}`],

		[`GET ${CF_ROUTINGS_PAYMENT.GET_LIST_TRANSACTION_BY_USER_WITH_STATUS}`] : 
		[`${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.GET_LIST_TRANSACTION_BY_USER_WITH_STATUS}`],
		
		[`PUT ${CF_ROUTINGS_PAYMENT.UPDATE_STATUS}`] : 
		[`${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.UPDATE_STATUS}`],

		[`POST ${CF_ROUTINGS_PAYMENT.CREATE_URL_PAYMENT}`] : 
		[`${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.CREATE_URL_PAYMENT}`],

		[`GET ${CF_ROUTINGS_PAYMENT.URL_RETURN_PAYMENT}`] : 
		[`${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.URL_RETURN_PAYMENT}`]
	},

	
	// Disable to call not-mapped actions
	mappingPolicy: "all", // Available values: "all", "restrict"

	// Set CORS headers
	// cors: true,
	// Global CORS settings for all routes
	cors: {
		// Configures the Access-Control-Allow-Origin CORS header.
		origin: "*",
		// Configures the Access-Control-Allow-Methods CORS header. 
		methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
		// Configures the Access-Control-Allow-Headers CORS header.
		allowedHeaders: [],
		// Configures the Access-Control-Expose-Headers CORS header.
		exposedHeaders: [],
		// Configures the Access-Control-Allow-Credentials CORS header.
		credentials: false,
		// Configures the Access-Control-Max-Age CORS header.
		maxAge: 3600
	},

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
	logging: true,

	/**
	 * ROUTE Hooks: cấu hình map từ req -> ctx
	 */
	 onBeforeCall(ctx, route, req, res) {
		// Set request headers to context meta
		ctx.meta.userAgent = req.headers["user-agent"];
		ctx.meta.ipAddr    = req.headers['x-forwarded-for'] 	||
								req.connection.remoteAddress 	||
								req.socket.remoteAddress 		||
								req.connection.socket.remoteAddress;
	},
};
