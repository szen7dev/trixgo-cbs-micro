"use strict";
const { CF_DOMAIN_SERVICES } 	= require('./helper/domain.constant');

/**
 * ------import route's Services---------
 */
const { CF_ROUTINGS_GATEWAY } 		= require('./helper/gateway.routes-constant');
const { CF_ROUTINGS_AUTH } 			= require('../auth/helper/auth.routes-constant');

/**
 * ------import action's Services--------
 */
 const { CF_ACTIONS_GATEWAY } 		= require('./helper/gateway.actions-constant');
 const { CF_ACTIONS_AUTH } 			= require('../auth/helper/auth.actions-constant');


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

		//--------------------------aliases's AUTH service--------------------------//
		[`POST ${CF_ROUTINGS_AUTH.USERS}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.REGISTER}`],
		
		/**
		 * Code: A0015
		 */
		[`POST ${CF_ROUTINGS_AUTH.LOGIN}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.LOGIN}`],

		/**
		 * Code: A0016
		*/ 
		[`GET ${CF_ROUTINGS_AUTH.SEND_OPT_RESET_PASSWORD}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.SEND_OPT_RESET_PASSWORD}`],

		/**
		 * Code: A0017
		 */
		[`GET ${CF_ROUTINGS_AUTH.CONFIRM_CODE_RESET_PASSWORD}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.CONFIRM_CODE_RESET_PASSWORD}`],

		/**
		 * Code: A0018
		 */
		[`POST ${CF_ROUTINGS_AUTH.UPDATE_PASSWORD_AFTER_FORGET}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.UPDATE_PASSWORD_AFTER_FORGET}`],
		
		// A00146
		// [`POST ${CF_ROUTINGS_AUTH.UPDATE_PASSWORD_AFTER_FORGET}`] : 
		// [`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.UPDATE_PASSWORD_AFTER_FORGET}`],
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
		allowedHeaders: ['X-Requested-With', 'content-type', 'Authorization'],
		// Configures the Access-Control-Expose-Headers CORS header.
		exposedHeaders: [],
		// Configures the Access-Control-Allow-Credentials CORS header.
		credentials: true,
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
