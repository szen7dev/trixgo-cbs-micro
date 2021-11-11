"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 	        	= require('./helper/item.actions-constant');

const ITEM__CONTRACT_HANDLER            = require('./handler/item.contract-handler');
const ITEM__CONTACT_HANDLER            	= require('./handler/item.contact-hanlder');
const ITEM__DEPARTMENT_HANDLER          = require('./handler/item.department-handler');

const ITEM__CONTRACT_COLL				= require('./database/item.contract-coll');
const ITEM__CONTACT_COLL				= require('./database/item.contact-coll');
const ITEM__DEPARTMENT_COLL				= require('./database/item.department-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ITEM,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(ITEM__CONTRACT_COLL),
		DbService(ITEM__CONTACT_COLL),
		DbService(ITEM__DEPARTMENT_COLL),

		CacheCleaner([CF_DOMAIN_SERVICES.ITEM])
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
		//==========================================  CONTRACT ACTIONS  ================================
		[CF_ACTIONS_ITEM.UPDATE_CONTRACT_BY_CONDITION] 		: ITEM__CONTRACT_HANDLER.updateContractByCondition,
		[CF_ACTIONS_ITEM.CONTRACT_GET_LIST] 				: ITEM__CONTRACT_HANDLER.getListContract,

		//==========================================  DEPARTMENT ACTIONS  ================================
		[CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST] 				: ITEM__DEPARTMENT_HANDLER.getInfoAndGetList,

		//==========================================  CONTACT ACTIONS  ================================
		[CF_ACTIONS_ITEM.CONTACT_GET_LIST] 					: ITEM__CONTACT_HANDLER.getListContact,
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
