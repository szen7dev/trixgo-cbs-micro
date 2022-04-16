"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CMCS } 	        	= require('./helper/cmcs.actions-constant');

const CMCS__CONTRACT_BILL_JOB_COLL		= require('./database/cmcs.contract_bill_job-coll');
const CMCS__CONTRACT_IPC_COLL			= require('./database/cmcs.contract_ipc-coll');
const CMCS__CONTRACT_PRODUCTION_COLL	= require('./database/cmcs.contract_production-coll');
const CMCS__CONTRACT_PAYMENT_COLL		= require('./database/cmcs.contract_payment-coll');

const CMCS__CONTRACT_BILL_JOB_HANDLER   = require('./handler/cmcs.contract_bill_job-handler');
const CMCS__CONTRACT_IPC_HANDLER   		= require('./handler/cmcs.contract_ipc-handler');
const CMCS__CONTRACT_PRODUCTION_HANDLER = require('./handler/cmcs.contract_production-handler');
const CMCS__CONTRACT_PAYMENT_HANDLER 	= require('./handler/cmcs.contract_payment-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.CMCS,
	mixins: [
		DbService(CMCS__CONTRACT_BILL_JOB_COLL),  
		DbService(CMCS__CONTRACT_IPC_COLL),
		DbService(CMCS__CONTRACT_PRODUCTION_COLL),  
		DbService(CMCS__CONTRACT_PAYMENT_COLL),  
		CacheCleaner([CF_DOMAIN_SERVICES.CMCS])
    ],

	/**
	* Service metadata
	*/
	metadata: {

	},
	/**
	* Service dependencies
	*/
	dependencies: [
		CF_DOMAIN_SERVICES.AUTH
	],

	/**
	* Actions
	*/
	actions: {	
		//==========================================   CONTRACT BILL JOB ACTIONS   ================================
		[CF_ACTIONS_CMCS.CONTRACT_BILL_JOB_GET_LIST]: CMCS__CONTRACT_BILL_JOB_HANDLER.getListAndGetInfoContractBillJob,

		//==========================================   CONTRACT IPC   ================================
		[CF_ACTIONS_CMCS.CONTRACT_IPC_INSERT]   			 						: CMCS__CONTRACT_IPC_HANDLER.insert,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_UPDATE]   			 						: CMCS__CONTRACT_IPC_HANDLER.update,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_REMOVE]				 						: CMCS__CONTRACT_IPC_HANDLER.remove,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_GET_INFO_AND_GET_LIST]						: CMCS__CONTRACT_IPC_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_GET_AMOUNT_BY_MONTH]							: CMCS__CONTRACT_IPC_HANDLER.getAmountByMonth,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_GET_LIST_BY_MONTH]							: CMCS__CONTRACT_IPC_HANDLER.getListByMonth,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_GET_AMOUNT_BY_OBJECT]							: CMCS__CONTRACT_IPC_HANDLER.getAmountByObject,

		//==========================================   CONTRACT PRODUCTION   ================================
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_INSERT]   								: CMCS__CONTRACT_PRODUCTION_HANDLER.insert,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_UPDATE]   								: CMCS__CONTRACT_PRODUCTION_HANDLER.update,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_REMOVE]   								: CMCS__CONTRACT_PRODUCTION_HANDLER.remove,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_GET_INFO_AND_GET_LIST] 				: CMCS__CONTRACT_PRODUCTION_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_GET_AMOUNT_BY_OBJECT]					: CMCS__CONTRACT_PRODUCTION_HANDLER.getAmountByObject,

		//==========================================   CONTRACT PAYMENT   ================================
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_INSERT]   								: CMCS__CONTRACT_PAYMENT_HANDLER.insert,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_UPDATE]   								: CMCS__CONTRACT_PAYMENT_HANDLER.update,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_REMOVE]   								: CMCS__CONTRACT_PAYMENT_HANDLER.remove,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_GET_INFO_AND_GET_LIST]					: CMCS__CONTRACT_PAYMENT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_GET_AMOUNT_BY_MONTH]						: CMCS__CONTRACT_PAYMENT_HANDLER.getAmountByMonth,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_GET_LIST_BY_MONTH]						: CMCS__CONTRACT_PAYMENT_HANDLER.getListByMonth,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_GET_AMOUNT_CONTRACT_VALUE_GROUP_BY_DATE]	: CMCS__CONTRACT_PAYMENT_HANDLER.getAmountContractValueGroupByDate,
		[CF_ACTIONS_CMCS.CONTRACT_PAYMENT_AMOUNT_BY_OBJECT]							: CMCS__CONTRACT_PAYMENT_HANDLER.getAmountByObject,
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
