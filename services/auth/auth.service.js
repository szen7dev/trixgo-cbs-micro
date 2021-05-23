"use strict";
const DbService                		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 	        = require('./helper/auth.actions-constant');
const AUTH__COMPANY_HANDLER			= require('./handler/auth.company-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.AUTH,
	mixins: [
		// DbService(CATEGORY_COLL), 
		DbService('categories'), 
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
	
		[CF_ACTIONS_AUTH.INSERT_FAST] 		: AUTH__COMPANY_HANDLER.insertFast,
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
