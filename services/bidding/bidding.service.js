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
const BIDDING__BILL_HANDLER            = require('./handler/bidding.bill-handler');

/**
 * COLLECTIONS
 */
const BIDDING__BILL_COLL				= require('./database/bidding.bill-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ITEM,
	mixins: [
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
		//==========================================  CONTRACT  ==================================
		// [CF_ACTIONS_BIDDING.INSERT_DOCUMENT] 						: ITEM__CONTRACT_HANDLER.insert,
		// [CF_ACTIONS_BIDDING.CONTRACT_UPDATE] 						: ITEM__CONTRACT_HANDLER.update,
		// [CF_ACTIONS_BIDDING.CONTRACT_REMOVE] 						: ITEM__CONTRACT_HANDLER.remove,
		// [CF_ACTIONS_BIDDING.CONTRACT_GET_INFO_AND_GET_LIST] 		: ITEM__CONTRACT_HANDLER.getInfoAndGetList,
		// [CF_ACTIONS_BIDDING.CONTRACT_GET_LIST_CONTRACT_IS_MEMBERS]	: ITEM__CONTRACT_HANDLER.getListIsMembers,

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
