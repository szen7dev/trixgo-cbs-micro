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
const ITEM__AREA_HANDLER          		= require('./handler/item.area-handler');
const ITEM__POSITION_HANDLER          	= require('./handler/item.position-handler');
const ITEM__STORAGE_HANDLER          	= require('./handler/item.storage-handler');
const ITEM__ACCOUNT_HANDLER          	= require('./handler/item.account-handler');


/**
 * COLLECTIONS
 */
const ITEM__CONTRACT_COLL				= require('./database/item.contract-coll');
const ITEM__DEPARTMENT_COLL				= require('./database/item.department-coll');
const ITEM__AREA_COLL					= require('./database/item.area-coll');
const ITEM__DOCTYPE_COLL				= require('./database/item.doctype-coll');
const ITEM__CONTACT_COLL				= require('./database/item.contact-coll');
const ITEM__WAREHOUSE_COLL				= require('./database/item.warehouse-coll');
const ITEM__POSITION_COLL				= require('./database/item.position-coll');
const ITEM__STORAGE_COLL				= require('./database/item.storage-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ITEM,
	mixins: [
		DbService(ITEM__CONTRACT_COLL),
		DbService(ITEM__DEPARTMENT_COLL),
		DbService(ITEM__AREA_COLL),
		DbService(ITEM__DOCTYPE_COLL),
		DbService(ITEM__CONTACT_COLL),
		DbService(ITEM__WAREHOUSE_COLL),
		DbService(ITEM__POSITION_COLL),
		DbService(ITEM__STORAGE_COLL),
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
		[CF_ACTIONS_ITEM.CONTACT_INSERT] 						: ITEM__CONTACT_HANDLER.insert,
		[CF_ACTIONS_ITEM.CONTACT_UPDATE] 						: ITEM__CONTACT_HANDLER.update,
		[CF_ACTIONS_ITEM.CONTACT_GET_INFO_AND_GET_LIST] 		: ITEM__CONTACT_HANDLER.getInfoAndGetList,
		
		//==========================================  WAREHOUSE  ================================
		[CF_ACTIONS_ITEM.WAREHOUSE_GET_INFO_AND_GET_LIST] 		: ITEM__WAREHOUSE_HANDLER.getInfoAndGetList,

		//==========================================  AREA  ================================
		[CF_ACTIONS_ITEM.AREA_GET_INFO_AND_GET_LIST] 		    : ITEM__AREA_HANDLER.getInfoAndGetList,

		//==========================================  POSITION  ================================
		[CF_ACTIONS_ITEM.POSITION_GET_INFO_AND_GET_LIST] 		: ITEM__POSITION_HANDLER.getInfoAndGetList,

		//==========================================  STORAGE  ================================
		[CF_ACTIONS_ITEM.STORAGE_GET_INFO_AND_GET_LIST] 		: ITEM__STORAGE_HANDLER.getInfoAndGetList,
		
		//==========================================  ACCOUNT  ================================
		[CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_NAME] 			: ITEM__ACCOUNT_HANDLER.getInfoAccountWithName,
		[CF_ACTIONS_ITEM.ACCOUNT_GET_INFO_WITH_ID] 				: ITEM__ACCOUNT_HANDLER.getInfoAccount,
		[CF_ACTIONS_ITEM.ACCOUNT_GET_LIST_NESTED] 				: ITEM__ACCOUNT_HANDLER.getListNestedItem,

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
