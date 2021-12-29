"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 	        	= require('./helper/item.actions-constant');

/**
 * HANDLERS
 */
const ITEM__CONTRACT_HANDLER            = require('./handler/item.contract-handler');
const ITEM__DEPARTMENT_HANDLER          = require('./handler/item.department-handler');
const ITEM__DOCTYPE_HANDLER          	= require('./handler/item.doctype-handler');
const ITEM__CONTACT_HANDLER          	= require('./handler/item.contact-handler');
const ITEM__WAREHOUSE_HANDLER          	= require('./handler/item.warehouse-handler');

/**
 * COLLECTIONS
 */
const ITEM__CONTRACT_COLL				= require('./database/item.contract-coll');
const ITEM__DEPARTMENT_COLL				= require('./database/item.department-coll');
const ITEM__AREA_COLL					= require('./database/item.area-coll');
const ITEM__DOCTYPE_COLL				= require('./database/item.doctype-coll');
const ITEM__CONTACT_COLL				= require('./database/item.contact-coll');
const ITEM__WAREHOUSE_COLL				= require('./database/item.warehouse-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ITEM,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(ITEM__CONTRACT_COLL),
		DbService(ITEM__DEPARTMENT_COLL),
		DbService(ITEM__AREA_COLL),
		DbService(ITEM__DOCTYPE_COLL),
		DbService(ITEM__CONTACT_COLL),
		DbService(ITEM__WAREHOUSE_COLL),
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
		//==========================================  CONTRACT  ================================
		[CF_ACTIONS_ITEM.CONTRACT_INSERT] 						: ITEM__CONTRACT_HANDLER.insert,
		[CF_ACTIONS_ITEM.CONTRACT_UPDATE] 						: ITEM__CONTRACT_HANDLER.update,
		[CF_ACTIONS_ITEM.CONTRACT_REMOVE] 						: ITEM__CONTRACT_HANDLER.remove,
		[CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST] 		: ITEM__CONTRACT_HANDLER.getInfoAndGetList,


		//==========================================  DEPARTMENT  ================================
		[CF_ACTIONS_ITEM.DEPARTMENT_INSERT] 					: ITEM__DEPARTMENT_HANDLER.insert,
		[CF_ACTIONS_ITEM.DEPARTMENT_UPDATE] 					: ITEM__DEPARTMENT_HANDLER.update,
		[CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST] 					: ITEM__DEPARTMENT_HANDLER.getInfoAndGetList,
	
		//==========================================  DOCTYPE  ==================================
		[CF_ACTIONS_ITEM.DOCTYPE_GET_INFO_AND_GET_LIST] 		: ITEM__DOCTYPE_HANDLER.getInfoAndGetList,

		//==========================================  CONTACT  ==================================
		[CF_ACTIONS_ITEM.CONTACT_GET_INFO_AND_GET_LIST] 		: ITEM__CONTACT_HANDLER.getInfoAndGetList,

		//==========================================  WAREHOUSE  ================================
		[CF_ACTIONS_ITEM.WAREHOUSE_GET_INFO_AND_GET_LIST] 		: ITEM__WAREHOUSE_HANDLER.getInfoAndGetList,
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
