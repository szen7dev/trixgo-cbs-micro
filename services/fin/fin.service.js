"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_FIN } 	        	= require('./helper/fin.actions-constant');

/**
 * HANDLERS
 */
const FIN__CASH_FLOW_PLAN_HANDLER       = require('./handler/fin.cash_flow_plan-handler');

/**
 * COLLECTIONS
 */
const FIN__CASH_FLOW_PLAN_COLL				= require('./database/fin.cash_flow_plan-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.FIN,
	mixins: [
		DbService(FIN__CASH_FLOW_PLAN_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.FIN])
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
		//==========================================  CASH_FLOW_PLAN  ==================================
		[CF_ACTIONS_FIN.CASH_FLOW_PLAN_INSERT] 						: FIN__CASH_FLOW_PLAN_HANDLER.insert,
		// [CF_ACTIONS_ITEM.CONTRACT_UPDATE] 						: ITEM__CONTRACT_HANDLER.update,
		// [CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST] 		: ITEM__CONTRACT_HANDLER.getInfoAndGetList,
		// [CF_ACTIONS_ITEM.CONTRACT_GET_LIST_CONTRACT_IS_MEMBERS]	: ITEM__CONTRACT_HANDLER.getListIsMembers,
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