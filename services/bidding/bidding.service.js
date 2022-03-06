"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_BIDDING } 	        	= require('./helper/bidding.actions-constant');

/**
 * HANDLERS
 */
const BIDDING__DOC_HANDLER            = require('./handler/bidding.plan-handler');

/**
 * COLLECTIONS
 */
const BIDDING__DOC_COLL				= require('./database/bidding.plan-coll');
const BIDDING__BILL_COLL				= require('./database/bidding.bill-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.BIDDING,
	mixins: [
		DbService(BIDDING__DOC_COLL),
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
		[CF_ACTIONS_BIDDING.BIDDING_DOC_INSERT] 						: BIDDING__DOC_HANDLER.insert,
		// [CF_ACTIONS_BIDDING.BIDDING_DOC_UPDATE] 						: BIDDING__DOC_HANDLER.update,
		[CF_ACTIONS_BIDDING.BIDDING_DOC_REMOVE] 						: BIDDING__DOC_HANDLER.remove,
		[CF_ACTIONS_BIDDING.BIDDING_DOC_GET_INFO_AND_GET_LIST] 			: BIDDING__DOC_HANDLER.getInfoAndGetList,

		//==========================================  DEPARTMENT  ================================
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
