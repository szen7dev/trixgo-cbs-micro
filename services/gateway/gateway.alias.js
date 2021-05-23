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

/**
 * ------import route's Services---------
 */
const { CF_ROUTINGS_AUTH } 		= require('../auth/helper/auth.routes-constant');
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
		[`POST ${CF_ROUTINGS_AUTH.INSERT_FAST}`] : 
		[`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.INSERT_FAST}`],
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
