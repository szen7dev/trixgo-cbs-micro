"use strict";
const DbService                		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 	        = require('./helper/auth.actions-constant');
const AUTH__USER_HANDLER			= require('./handler/auth.user-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.AUTH,
	mixins: [
		DbService('users'), 
		DbService('companies'), 

		CacheCleaner([CF_DOMAIN_SERVICES.AUTH])
	],
	/**
	 	* Service settings
	*/
	// settings: {
	// 	fields: ["_id", "name", "products"],
	// 	populates : {
	// 		"products": {
	// 			action: "products.get",
	// 			params: ["name"]
	// 		}
	// 	},
	// 	entityValidator: {
	// 		name: { type: "string"}
	// 	}
	// },

	/**
	 	* Service metadata
	*/
	metadata: {

	},

	/**
		 * Service dependencies
	*/
	dependencies: [],

	/**
 		* Actions
	*/
	actions: {
		//============================   AUTH: USER   ==========================//
		[CF_ACTIONS_AUTH.REGISTER] 									: AUTH__USER_HANDLER.register,
		[CF_ACTIONS_AUTH.LOGIN] 									: AUTH__USER_HANDLER.login,
		[CF_ACTIONS_AUTH.GET_INFO] 									: AUTH__USER_HANDLER.getInfo,
		[CF_ACTIONS_AUTH.UPDATE_DEVICE_WHEN_LOGIN_MOBILE] 			: AUTH__USER_HANDLER.updateDeviceLogin,
		[CF_ACTIONS_AUTH.RESOLVE_TOKEN] 							: AUTH__USER_HANDLER.resolveToken,
	},

	/**
	 	* Events
	*/
	events: {
	},

	/**
	 	* Methods
	*/
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	*/
	created() {

	},

	/**
	* Service started lifecycle event handler
	*/
	async started() {

	},

	/**
	 	* Service stopped lifecycle event handler
	*/
	async stopped() {

	}
};
