"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ACCOUNTING } 	        = require('./helper/accounting.actions-constant');

/**
 * HANDLERS
 */
const ACCOUNTING__FINANCIAL_VOUCHER_HANDLE         = require('./handler/accounting.financial_voucher');
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLE         = require('./handler/accounting.financial_general_journal');

module.exports = {
	name: CF_DOMAIN_SERVICES.ACCOUNTING,
	mixins: [
		DbService('financial_voucher'),
		DbService('financial_general_journal'),
		// CacheCleaner([CF_DOMAIN_SERVICES.CHATTING])
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
	dependencies: [
		// CF_DOMAIN_SERVICES.AUTH
	],

	/**
	* Actions
	*/
	actions: {
		// ======================   ===========================

		// Phiếu 
		[CF_ACTIONS_ACCOUNTING.INSERT_FULL_VOUCHER] 		            			: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.insertFull,
		[CF_ACTIONS_ACCOUNTING.UPDATE_FULL_VOUCHER] 		            			: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.update,
		[CF_ACTIONS_ACCOUNTING.REMOVE_VOUCHER] 		            					: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.remnove,
		[CF_ACTIONS_ACCOUNTING.GET_LIST_VOUCHER_OF_COMPANY] 		            	: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.getListVoucherOfCompany,
		[CF_ACTIONS_ACCOUNTING.GET_LIST_VAT_VOUCHER_OF_COMPANY] 		           	: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.getListVATVoucherOfCompany,
		[CF_ACTIONS_ACCOUNTING.FIND_VOUCHER_IN_COMPANY] 		            		: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.findVoucherInCompany,
		[CF_ACTIONS_ACCOUNTING.GET_INFO_VOUCHER] 		            				: ACCOUNTING__FINANCIAL_VOUCHER_HANDLE.getInfoVoucher,
		// Chi tiết phiếu
		[CF_ACTIONS_ACCOUNTING.INSERT_FULL_GENERAL_JOURNAL] 		            	: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLE.insertFull,
		[CF_ACTIONS_ACCOUNTING.REMOVE_GENERAL_JOURNAL] 		            			: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLE.removeById,
		[CF_ACTIONS_ACCOUNTING.GET_INFO_GENERAL_JOURNAL_BY_ID] 		            	: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLE.getInfo,
		[CF_ACTIONS_ACCOUNTING.UPDATE_GENERAL_JOURNAL]		 		            	: ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLE.update,
		[CF_ACTIONS_ACCOUNTING.GET_LIST_OF_ACCOUNT_GENERAL_JOURNAL]		 		    : ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_HANDLE.getListJournalOfAccount,
		
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
