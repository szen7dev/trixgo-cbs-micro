"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 	        = require('./helper/cmcs.actions-constant');

module.exports = {
	name: CF_DOMAIN_SERVICES.REACTION,
	mixins: [
		// gọi tất cả các function dùng ở đây
		// DbService(REACTION__REACTION_COLL),  
		// DbService(REACTION__COMMENT_COLL),  
		// CacheCleaner([CF_DOMAIN_SERVICES.REACTION])
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
		//==========================================   REACTION ACTIONS   ================================
		// [CF_ACTIONS_REACTION.REACTION_GET_LIST ] 	: REACTION__REACTION_HANDLER.getList,
		// [CF_ACTIONS_REACTION.REACTION_INSERT ] 		       : REACTION__REACTION_HANDLER.insertReaction,
		//==========================================   COMMENT_FILE_CORE ACTIONS   ================================
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
"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CMCS } 	        	= require('./helper/cmcs.actions-constant');

const CMCS__CONTRACT_BILL_JOB_HANDLER   = require('./handler/cmcs.contract_bill_job-hanlder');
const CMCS__CONTRACT_BILL_JOB_COLL		= require('./database/cmcs.contract_bill_job-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.CMCS,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(CMCS__CONTRACT_BILL_JOB_COLL),  
		
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
		[CF_ACTIONS_CMCS.CONTRACT_BILL_JOB_GET_LIST	] 		: CMCS__CONTRACT_BILL_JOB_HANDLER.getListAndGetInfoContractBillJob,
		
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
