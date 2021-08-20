"use strict";
const DbService                		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 	        = require('./helper/auth.actions-constant');
const AUTH__USER_HANDLER			= require('./handler/auth.user-handler');

const AUTH__USER_COLL				= require('./database/auth.user-coll');
const AUTH__COMPANY_COLL			= require('./database/auth.company-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.AUTH,
	mixins: [
		DbService(AUTH__USER_COLL), 
		DbService(AUTH__COMPANY_COLL), 

		CacheCleaner([CF_DOMAIN_SERVICES.AUTH])
	],
	/**
	 	* Service settings
	*/
	settings: {
		// fields: ["_id", "name", "products"],
		// populates : {
		// 	"products": {
		// 		action: "products.get",
		// 		params: ["name"]
		// 	}
		// },
		// entityValidator: {
		// 	name: { type: "string"}
		// }
		autoAliases: true,
	},

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
		[CF_ACTIONS_AUTH.SEARCH_WITH_FIND] 							: AUTH__USER_HANDLER.searchWithFind,
		[CF_ACTIONS_AUTH.SEARCH_WITH_FULL_TEXT] 					: AUTH__USER_HANDLER.searchWithFullText,
		[CF_ACTIONS_AUTH.UPDATE_PASSWORD] 							: AUTH__USER_HANDLER.changePassword,
		[CF_ACTIONS_AUTH.UPDATE_FULLNAME] 							: AUTH__USER_HANDLER.changeFullname,
		[CF_ACTIONS_AUTH.UPDATE_EMAIL] 								: AUTH__USER_HANDLER.changeEmail,
		[CF_ACTIONS_AUTH.UPDATE_PHONE] 								: AUTH__USER_HANDLER.changePhone,
		[CF_ACTIONS_AUTH.UPDATE_LANGUAGE] 							: AUTH__USER_HANDLER.changeLanguage,
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
