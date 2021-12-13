"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 	        	= require('./helper/item.actions-constant');

const ITEM__CONTRACT_HANDLER            = require('./handler/item.contract-handler');
const ITEM__DEPARTMENT_HANDLER          = require('./handler/item.department-handler');

const ITEM__CONTRACT_COLL				= require('./database/item.contract-coll');
const ITEM__DEPARTMENT_COLL				= require('./database/item.department-coll');
const ITEM__AREA_COLL					= require('./database/item.area-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ITEM,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(ITEM__CONTRACT_COLL),
		DbService(ITEM__DEPARTMENT_COLL),
		DbService(ITEM__AREA_COLL),
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
		[CF_ACTIONS_ITEM.UPDATE_CONTRACT_BY_CONDITION] 			: ITEM__CONTRACT_HANDLER.updateContractByCondition,
		[CF_ACTIONS_ITEM.CONTRACT_GET_LIST] 					: ITEM__CONTRACT_HANDLER.getListContract,

		//==========================================  DEPARTMENT ACTIONS  ================================
		[CF_ACTIONS_ITEM.DEPARTMENT_INSERT] 					: ITEM__DEPARTMENT_HANDLER.insert,
		[CF_ACTIONS_ITEM.DEPARTMENT_UPDATE] 					: ITEM__DEPARTMENT_HANDLER.update,
		[CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST] 					: ITEM__DEPARTMENT_HANDLER.getInfoAndGetList,
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
