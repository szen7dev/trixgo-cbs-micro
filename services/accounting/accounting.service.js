"use strict";

const DbService                	    					= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    				= require("../../tools/mixins/cache.cleaner.mixin");

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    				= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ACCOUNTING } 	    				= require('./helper/accounting.actions-constant');

/**
 * HANDLERS
 */
const ACCOUNTING__FINANCIAL_VOUCHER_HANDLER       	    = require('./handler/accounting.financial_voucher-handler');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER     = require('./handler/accounting.financial_general_journal-handler');

/**
 * COLLECTIONS
 */
const ACCOUNTING__FINANCIAL_VOUCHER_COLL				= require('./database/accounting.financial_voucher-coll');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL		= require('./database/accounting.financial_general_journal-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ACCOUNTING,
	mixins: [
		DbService(ACCOUNTING__FINANCIAL_VOUCHER_COLL),
		DbService(ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.ACCOUNTING])
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
		[CF_ACTIONS_ACCOUNTING.VOUCHER_INSERT] 								: ACCOUNTING__FINANCIAL_VOUCHER_HANDLER.insert,
		[CF_ACTIONS_ACCOUNTING.VOUCHER_UPDATE] 								: ACCOUNTING__FINANCIAL_VOUCHER_HANDLER.update,
		[CF_ACTIONS_ACCOUNTING.VOUCHER_REMOVE] 								: ACCOUNTING__FINANCIAL_VOUCHER_HANDLER.remove,
		[CF_ACTIONS_ACCOUNTING.VOUCHER_GET_INFO_AND_GET_LIST] 				: ACCOUNTING__FINANCIAL_VOUCHER_HANDLER.getInfoAndGetList,

		//==========================================  CASH_BOOK  ==================================
		[CF_ACTIONS_ACCOUNTING.JOURNAL_INSERT] 								: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER.insert,
		[CF_ACTIONS_ACCOUNTING.JOURNAL_UPDATE] 								: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER.update,
		[CF_ACTIONS_ACCOUNTING.JOURNAL_REMOVE] 								: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER.remove,
		[CF_ACTIONS_ACCOUNTING.JOURNAL_GET_INFO_AND_GET_LIST] 				: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_ACCOUNTING.JOURNAL_CAL_IMPLE_BUDGET]		 		    : ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER.calImpleBudget,
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