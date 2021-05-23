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
const { CF_ACTIONS_EXAMPLE } 	= require('../example/helper/actions.constant.example');

/**
 * ------import route's Services---------
 */
const { CF_ROUTINGS_EXAMPLE } = require('../example/helper/routes.constant.example');
module.exports = {
	path: CF_DOMAIN_SERVICES.API,

	// authentication: true,
	// authorization: true,

	// Cho phép truy cập tất cả các services
	whitelist: [
		"**",
	],

	aliases: {

		//--------------------------aliases's EXAMPLE service--------------------------//
		[`GET ${CF_ROUTINGS_EXAMPLE.ORIGIN_APP}`] : 
		[`${CF_DOMAIN_SERVICES.EXAMPLES}.${CF_ACTIONS_EXAMPLE.GET_LIST}`],
		[`POST ${CF_ROUTINGS_EXAMPLE.ORIGIN_APP}`] : 
		[CHECK_AUTHORIZATION, `${CF_DOMAIN_SERVICES.EXAMPLES}.${CF_ACTIONS_EXAMPLE.CREATE}`],
		[`GET ${CF_ROUTINGS_EXAMPLE.REMOVE}`] : 
		[CHECK_AUTHORIZATION,`${CF_DOMAIN_SERVICES.EXAMPLES}.${CF_ACTIONS_EXAMPLE.REMOVE}`],
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
