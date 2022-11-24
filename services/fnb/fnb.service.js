"use strict";

const DbService                	    		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    	= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_FNB } 	    			= require('./helper/fnb.actions-constant');

const FNB__ORDER_HANDLER  			 		= require('./handler/fnb.order-handler');
const FNB__PRODUCT_HANDLER  			 	= require('./handler/fnb.product-handler');
const FNB__SHIFT_HANDLER  			 		= require('./handler/fnb.shift-handler');

const FNB__ORDER_COLL  			 			= require('./database/fnb.order-coll');
const FNB__PRODUCT_COLL  			 		= require('./database/fnb.product-coll');
const FNB__SHIFT_COLL  			 			= require('./database/fnb.shift-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.FNB,
	mixins: [
		DbService(FNB__ORDER_COLL),
		DbService(FNB__PRODUCT_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.FNB])
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
		//========================================== FNB_ORDER ==============================================///
		[CF_ACTIONS_FNB.ORDER_INSERT]									: FNB__ORDER_HANDLER.insert,
		[CF_ACTIONS_FNB.ORDER_UPDATE]									: FNB__ORDER_HANDLER.update,
		[CF_ACTIONS_FNB.ORDER_REMOVE]									: FNB__ORDER_HANDLER.remove,
		[CF_ACTIONS_FNB.ORDER_GET_INFO_AND_GET_LIST]					: FNB__ORDER_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.ORDER_GET_LIST_BY_PROPERTY]						: FNB__ORDER_HANDLER.getListByProperty,

		//========================================== FNB_PRODUCT ==============================================///
		[CF_ACTIONS_FNB.PRODUCT_INSERT]									: FNB__PRODUCT_HANDLER.insert,
		[CF_ACTIONS_FNB.PRODUCT_UPDATE]									: FNB__PRODUCT_HANDLER.update,
		[CF_ACTIONS_FNB.PRODUCT_REMOVE]									: FNB__PRODUCT_HANDLER.remove,
		[CF_ACTIONS_FNB.PRODUCT_GET_INFO_AND_GET_LIST]					: FNB__PRODUCT_HANDLER.getInfoAndGetList,

		//========================================== FNB_SHIFT ==============================================///
		[CF_ACTIONS_FNB.SHIFT_INSERT]									: FNB__SHIFT_HANDLER.insert,
		[CF_ACTIONS_FNB.SHIFT_UPDATE]									: FNB__SHIFT_HANDLER.update,
		[CF_ACTIONS_FNB.SHIFT_REMOVE]									: FNB__SHIFT_HANDLER.remove,
		[CF_ACTIONS_FNB.SHIFT_GET_INFO_AND_GET_LIST]					: FNB__SHIFT_HANDLER.getInfoAndGetList,

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