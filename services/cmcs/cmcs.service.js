"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CMCS } 	        	= require('./helper/cmcs.actions-constant');

const CMCS__CONTRACT_BILL_JOB_COLL		= require('./database/cmcs.contract_bill_job-coll');
const CMCS__CONTRACT_IPC_COLL			= require('./database/cmcs.contract_ipc-coll');
const CMCS__CONTRACT_PRODUCTION_COLL	= require('./database/cmcs.contract_production-coll');

const CMCS__CONTRACT_BILL_JOB_HANDLER   = require('./handler/cmcs.contract_bill_job-handler');
const CMCS__CONTRACT_IPC_HANDLER   		= require('./handler/cmcs.contract_ipc-handler');
const CMCS__CONTRACT_PRODUCTION_HANDLER = require('./handler/cmcs.contract_production-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.CMCS,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(CMCS__CONTRACT_BILL_JOB_COLL),  
		DbService(CMCS__CONTRACT_IPC_COLL),
		DbService(CMCS__CONTRACT_PRODUCTION_COLL),  
		
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
	dependencies: [],

	/**
	* Actions
	*/
	actions: {	
		//==========================================   CONTRACT BILL JOB ACTIONS   ================================
		[CF_ACTIONS_CMCS.CONTRACT_BILL_JOB_GET_LIST]: CMCS__CONTRACT_BILL_JOB_HANDLER.getListAndGetInfoContractBillJob,

		//==========================================   CONTRACT IPC   ================================
		[CF_ACTIONS_CMCS.CONTRACT_IPC_INSERT]   		: CMCS__CONTRACT_IPC_HANDLER.insert,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_UPDATE]   		: CMCS__CONTRACT_IPC_HANDLER.update,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_REMOVE]			: CMCS__CONTRACT_IPC_HANDLER.remove,
		[CF_ACTIONS_CMCS.CONTRACT_IPC_GET_INFO_AND_GET_LIST	]: CMCS__CONTRACT_IPC_HANDLER.getInfoAndGetList,

		//==========================================   CONTRACT PRODUCTION   ================================
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_INSERT]   		: CMCS__CONTRACT_PRODUCTION_HANDLER.insert,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_UPDATE]   		: CMCS__CONTRACT_PRODUCTION_HANDLER.update,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_REMOVE]   		: CMCS__CONTRACT_PRODUCTION_HANDLER.remove,
		[CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_GET_INFO_AND_GET_LIST] : CMCS__CONTRACT_PRODUCTION_HANDLER.getInfoAndGetList,
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
