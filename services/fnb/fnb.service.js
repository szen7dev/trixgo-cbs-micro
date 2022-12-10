"use strict";

const DbService                	    		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    	= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_FNB } 	    			= require('./helper/fnb.actions-constant');

const FNB__ORDER_HANDLER  			 		= require('./handler/fnb.order-handler');
const FNB__PRODUCT_HANDLER  			 	= require('./handler/fnb.product-handler');
const FNB__ORDER_PRODUCT_HANDLER  			= require('./handler/fnb.order_product-handler');
const FNB__SHIFT_HANDLER  			 		= require('./handler/fnb.shift-handler');
const FNB__MISTAKE_HANDLER  			 	= require('./handler/fnb.mistake-handler');
const FNB__QUOTA_HANDLER  			 		= require('./handler/fnb.quota-handler');
const FNB__ORDER_MATERIAL_HANDLER  			= require('./handler/fnb.order_material-handler');
const FNB__SHIFT_HANDOVER_HANDLER  			= require('./handler/fnb.shift_handover-handler');
const FNB__GENERAL_BOOK_HANDLER  			= require('./handler/fnb.general_book-handler');

const FNB__ORDER_COLL  			 			= require('./database/fnb.order-coll');
const FNB__PRODUCT_COLL  			 		= require('./database/fnb.product-coll');
const FNB__ORDER_PRODUCT_COLL  			 	= require('./database/fnb.order_product-coll');
const FNB__SHIFT_COLL  			 			= require('./database/fnb.shift-coll');
const FNB__MISTAKE_COLL  			 		= require('./database/fnb.mistake-coll');
const FNB__QUOTA_COLL  			 			= require('./database/fnb.quota-coll');
const FNB__ORDER_MATERIAL_COLL  			= require('./database/fnb.order_material-coll');
const FNB__SHIFT_HANDOVER_COLL  			= require('./database/fnb.shift_handover-coll');
const FNB__GENERAL_BOOK_COLL  				= require('./database/fnb.general_book-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.FNB,
	mixins: [
		DbService(FNB__ORDER_COLL),
		DbService(FNB__PRODUCT_COLL),
		DbService(FNB__ORDER_PRODUCT_COLL),
		DbService(FNB__SHIFT_COLL),
		DbService(FNB__MISTAKE_COLL),
		DbService(FNB__QUOTA_COLL),
		DbService(FNB__ORDER_MATERIAL_COLL),
		DbService(FNB__SHIFT_HANDOVER_COLL),
		DbService(FNB__GENERAL_BOOK_COLL),
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
		//========================================== FNB_ORDER ==============================================//
		[CF_ACTIONS_FNB.ORDER_INSERT]									: FNB__ORDER_HANDLER.insert,
		[CF_ACTIONS_FNB.ORDER_UPDATE]									: FNB__ORDER_HANDLER.update,
		[CF_ACTIONS_FNB.ORDER_REMOVE]									: FNB__ORDER_HANDLER.remove,
		[CF_ACTIONS_FNB.ORDER_GET_INFO_AND_GET_LIST]					: FNB__ORDER_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.ORDER_GET_LIST_BY_PROPERTY]						: FNB__ORDER_HANDLER.getListByProperty,
		[CF_ACTIONS_FNB.ORDER_UPDATE_VALUE]								: FNB__ORDER_HANDLER.updateValue,
		[CF_ACTIONS_FNB.ORDER_DOWNLOAD_TEMPLATE_EXCEL]					: FNB__ORDER_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.ORDER_IMPORT_FROM_EXCEL]						: FNB__ORDER_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.ORDER_EXPORT_EXCEL]								: FNB__ORDER_HANDLER.exportExcel,

		//========================================== FNB_PRODUCT ==============================================//
		[CF_ACTIONS_FNB.PRODUCT_INSERT]									: FNB__PRODUCT_HANDLER.insert,
		[CF_ACTIONS_FNB.PRODUCT_UPDATE]									: FNB__PRODUCT_HANDLER.update,
		[CF_ACTIONS_FNB.PRODUCT_REMOVE]									: FNB__PRODUCT_HANDLER.remove,
		[CF_ACTIONS_FNB.PRODUCT_GET_INFO_AND_GET_LIST]					: FNB__PRODUCT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.PRODUCT_DOWNLOAD_TEMPLATE_EXCEL]				: FNB__PRODUCT_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.PRODUCT_IMPORT_FROM_EXCEL]						: FNB__PRODUCT_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.PRODUCT_EXPORT_EXCEL]							: FNB__PRODUCT_HANDLER.exportExcel,

		//========================================== FNB_ORDER_PRODUCT ==============================================//
		[CF_ACTIONS_FNB.ORDER_PRODUCT_INSERT]							: FNB__ORDER_PRODUCT_HANDLER.insert,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_UPDATE]							: FNB__ORDER_PRODUCT_HANDLER.update,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_REMOVE]							: FNB__ORDER_PRODUCT_HANDLER.remove,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_GET_INFO_AND_GET_LIST]			: FNB__ORDER_PRODUCT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_GET_LIST_BY_PROPERTY]				: FNB__ORDER_PRODUCT_HANDLER.getListByProperty,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL]			: FNB__ORDER_PRODUCT_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_IMPORT_FROM_EXCEL]				: FNB__ORDER_PRODUCT_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.ORDER_PRODUCT_EXPORT_EXCEL]						: FNB__ORDER_PRODUCT_HANDLER.exportExcel,

		//========================================== FNB_SHIFT ==============================================//
		[CF_ACTIONS_FNB.SHIFT_INSERT]									: FNB__SHIFT_HANDLER.insert,
		[CF_ACTIONS_FNB.SHIFT_UPDATE]									: FNB__SHIFT_HANDLER.update,
		[CF_ACTIONS_FNB.SHIFT_REMOVE]									: FNB__SHIFT_HANDLER.remove,
		[CF_ACTIONS_FNB.SHIFT_GET_INFO_AND_GET_LIST]					: FNB__SHIFT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.SHIFT_DOWNLOAD_TEMPLATE_EXCEL]					: FNB__SHIFT_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.SHIFT_IMPORT_FROM_EXCEL]						: FNB__SHIFT_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.SHIFT_EXPORT_EXCEL]								: FNB__SHIFT_HANDLER.exportExcel,

		//========================================== FNB_MISTAKE ==============================================//
		[CF_ACTIONS_FNB.MISTAKE_INSERT]									: FNB__MISTAKE_HANDLER.insert,
		[CF_ACTIONS_FNB.MISTAKE_UPDATE]									: FNB__MISTAKE_HANDLER.update,
		[CF_ACTIONS_FNB.MISTAKE_REMOVE]									: FNB__MISTAKE_HANDLER.remove,
		[CF_ACTIONS_FNB.MISTAKE_GET_INFO_AND_GET_LIST]					: FNB__MISTAKE_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.MISTAKE_GET_LIST_BY_PROPERTY]					: FNB__MISTAKE_HANDLER.getListByProperty,
		[CF_ACTIONS_FNB.MISTAKE_DOWNLOAD_TEMPLATE_EXCEL]				: FNB__MISTAKE_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.MISTAKE_IMPORT_FROM_EXCEL]						: FNB__MISTAKE_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.MISTAKE_EXPORT_EXCEL]							: FNB__MISTAKE_HANDLER.exportExcel,

		//========================================== FNB_QUOTA ==============================================//
		[CF_ACTIONS_FNB.QUOTA_INSERT]									: FNB__QUOTA_HANDLER.insert,
		[CF_ACTIONS_FNB.QUOTA_UPDATE]									: FNB__QUOTA_HANDLER.update,
		[CF_ACTIONS_FNB.QUOTA_REMOVE]									: FNB__QUOTA_HANDLER.remove,
		[CF_ACTIONS_FNB.QUOTA_GET_INFO_AND_GET_LIST]					: FNB__QUOTA_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.QUOTA_DOWNLOAD_TEMPLATE_EXCEL]					: FNB__QUOTA_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.QUOTA_IMPORT_FROM_EXCEL]						: FNB__QUOTA_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.QUOTA_EXPORT_EXCEL]								: FNB__QUOTA_HANDLER.exportExcel,

		//========================================== FNB_ORDER_MATERIAL ==============================================//
		[CF_ACTIONS_FNB.ORDER_MATERIAL_INSERT]							: FNB__ORDER_MATERIAL_HANDLER.insert,
		[CF_ACTIONS_FNB.ORDER_MATERIAL_UPDATE]							: FNB__ORDER_MATERIAL_HANDLER.update,
		[CF_ACTIONS_FNB.ORDER_MATERIAL_REMOVE]							: FNB__ORDER_MATERIAL_HANDLER.remove,
		[CF_ACTIONS_FNB.ORDER_MATERIAL_GET_INFO_AND_GET_LIST]			: FNB__ORDER_MATERIAL_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.ORDER_MATERIAL_DOWNLOAD_TEMPLATE_EXCEL]			: FNB__ORDER_MATERIAL_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.ORDER_MATERIAL_IMPORT_FROM_EXCEL]				: FNB__ORDER_MATERIAL_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.ORDER_MATERIAL_EXPORT_EXCEL]					: FNB__ORDER_MATERIAL_HANDLER.exportExcel,

		//========================================== FNB_SHIFT_HANDOVER ==============================================//
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_INSERT]							: FNB__SHIFT_HANDOVER_HANDLER.insert,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_UPDATE]							: FNB__SHIFT_HANDOVER_HANDLER.update,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_REMOVE]							: FNB__SHIFT_HANDOVER_HANDLER.remove,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_GET_INFO_AND_GET_LIST]			: FNB__SHIFT_HANDOVER_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_UPDATE_QUOTA]					: FNB__SHIFT_HANDOVER_HANDLER.updateQuota,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_DOWNLOAD_TEMPLATE_EXCEL]			: FNB__SHIFT_HANDOVER_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_IMPORT_FROM_EXCEL]				: FNB__SHIFT_HANDOVER_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.SHIFT_HANDOVER_EXPORT_EXCEL]					: FNB__SHIFT_HANDOVER_HANDLER.exportExcel,

		//========================================== FNB_GENERAL_BOOK ==============================================//
		[CF_ACTIONS_FNB.GENERAL_BOOK_INSERT]							: FNB__GENERAL_BOOK_HANDLER.insert,
		[CF_ACTIONS_FNB.GENERAL_BOOK_UPDATE]							: FNB__GENERAL_BOOK_HANDLER.update,
		[CF_ACTIONS_FNB.GENERAL_BOOK_REMOVE]							: FNB__GENERAL_BOOK_HANDLER.remove,
		[CF_ACTIONS_FNB.GENERAL_BOOK_GET_INFO_AND_GET_LIST]				: FNB__GENERAL_BOOK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_FNB.GENERAL_BOOK_GET_LIST_BY_PROPERTY]				: FNB__GENERAL_BOOK_HANDLER.getListByProperty,
		[CF_ACTIONS_FNB.GENERAL_BOOK_DOWNLOAD_TEMPLATE_EXCEL]			: FNB__GENERAL_BOOK_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_FNB.GENERAL_BOOK_IMPORT_FROM_EXCEL]					: FNB__GENERAL_BOOK_HANDLER.importFromExcel,
		[CF_ACTIONS_FNB.GENERAL_BOOK_EXPORT_EXCEL]						: FNB__GENERAL_BOOK_HANDLER.exportExcel,
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