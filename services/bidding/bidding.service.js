"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_BIDDING } 	        = require('./helper/bidding.actions-constant');

/**
 * HANDLERS
 */

/**
 * COLLECTIONS
 */
const BIDDING__PLAN_COLL				= require('./database/bidding.plan-coll');
const BIDDING__BILL_COLL				= require('./database/bidding.bill-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.BIDDING,
	mixins: [
		DbService(BIDDING__PLAN_COLL),
		DbService(BIDDING__BILL_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.BIDDING])
    ],

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
		//==========================================  BIDDING_DOC  ==================================//

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
