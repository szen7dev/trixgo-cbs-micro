"use strict";

const DbService                		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 	        = require('./helper/operation.actions-constant');




module.exports = {
	name: CF_DOMAIN_SERVICES.AUTH,
	mixins: [
		// DbService(AUTH__COMPANY_COLL),
		// DbService(AUTH__USER_COLL),
		// DbService(AUTH__USER_FRIEND_COLL),
		// DbService(AUTH__REGISTER_TRIAL_COLL),
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
