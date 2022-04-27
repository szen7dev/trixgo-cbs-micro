"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_FIN } 	        	= require('./helper/accounting.actions-constant');

/**
 * HANDLERS
 */
const ACCOUNTING__FINANCIAL_VOUCHER_HANDLER       	    = require('./handler/fin.cash_flow_plan-handler');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLER     = require('./handler/fin.cash_book-handler');

/**
 * COLLECTIONS
 */
const ACCOUNTING__FINANCIAL_VOUCHER_COLL				= require('./database/fin.cash_flow_plan-coll');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL		= require('./database/fin.cash_book-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.FIN,
	mixins: [
		DbService(ACCOUNTING__FINANCIAL_VOUCHER_COLL),
		DbService(ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL),
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
		[CF_ACTIONS_FIN.CASH_FLOW_PLAN_INSERT] 								: FIN__CASH_FLOW_PLAN_HANDLER.insert,
		[CF_ACTIONS_FIN.CASH_FLOW_PLAN_UPDATE] 								: FIN__CASH_FLOW_PLAN_HANDLER.update,
		[CF_ACTIONS_FIN.CASH_FLOW_PLAN_REMOVE] 								: FIN__CASH_FLOW_PLAN_HANDLER.remove,
		[CF_ACTIONS_FIN.CASH_FLOW_PLAN_GET_INFO_AND_GET_LIST] 				: FIN__CASH_FLOW_PLAN_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FIN.CASH_FLOW_PLAN_GET_AMOUNT_BY_PROPERTY] 				: FIN__CASH_FLOW_PLAN_HANDLER.getAmountByProperty,

		//==========================================  CASH_BOOK  ==================================
		[CF_ACTIONS_FIN.CASH_BOOK_INSERT] 							: FIN__CASH_BOOK_HANDLER.insert,
		[CF_ACTIONS_FIN.CASH_BOOK_UPDATE] 							: FIN__CASH_BOOK_HANDLER.update,
		[CF_ACTIONS_FIN.CASH_BOOK_REMOVE] 							: FIN__CASH_BOOK_HANDLER.remove,
		[CF_ACTIONS_FIN.CASH_BOOK_GET_INFO_AND_GET_LIST] 			: FIN__CASH_BOOK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FIN.CASH_BOOK_GET_AMOUNT_BY_PROPERTY] 			: FIN__CASH_BOOK_HANDLER.getAmountByProperty,
		[CF_ACTIONS_FIN.CASH_BOOK_GET_GET_AMOUNT_INCOME_EXPENSE_BY_PARENT]	: FIN__CASH_BOOK_HANDLER.getAmountIncomeAndExpenseByParent,
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