"use strict";

const { Queue } 							= require("bullmq");
const IORedis 								= require("ioredis");
const { REDIS_SEPERATOR } 					= require("../../tools/cache/cf_redis");
const { isProd } 							= require("../../tools/utils/utils");
const DbService                	    		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    	= require("../../tools/mixins/cache.cleaner.mixin");

const { CF_DOMAIN_SERVICES } 		    	= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_STORE } 	    			= require('./helper/store.actions-constant');

const STORE__ORDER_HANDLER  			 	= require('./handler/store.order-handler');
const STORE__ORDER_PRODUCT_HANDLER  		= require('./handler/store.order_product-handler');
const STORE__VOUCHER_HANDLER  				= require('./handler/store.voucher-handler');

const STORE__ORDER_COLL  			 		= require('./database/store.order-coll');
const STORE__ORDER_PRODUCT_COLL  			= require('./database/store.order_product-coll');
const STORE__VOUCHER_COLL  					= require('./database/store.voucher-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.STORE,
	mixins: [
		DbService(STORE__ORDER_COLL),
		DbService(STORE__ORDER_PRODUCT_COLL),
		DbService(STORE__VOUCHER_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.STORE])
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
		//========================================== STORE_ORDER ==============================================//
		[CF_ACTIONS_STORE.ORDER_INSERT]									: STORE__ORDER_HANDLER.insert,
		[CF_ACTIONS_STORE.ORDER_UPDATE]									: STORE__ORDER_HANDLER.update,
		[CF_ACTIONS_STORE.ORDER_REMOVE]									: STORE__ORDER_HANDLER.remove,
		[CF_ACTIONS_STORE.ORDER_INSERT_FULL]							: STORE__ORDER_HANDLER.insertFull,
		[CF_ACTIONS_STORE.ORDER_GET_INFO_AND_GET_LIST]					: STORE__ORDER_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_STORE.ORDER_GET_LIST_BY_PROPERTY]					: STORE__ORDER_HANDLER.getListByProperty,
		[CF_ACTIONS_STORE.ORDER_DOWNLOAD_TEMPLATE_EXCEL]				: STORE__ORDER_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_STORE.ORDER_IMPORT_FROM_EXCEL]						: STORE__ORDER_HANDLER.importFromExcel,
		[CF_ACTIONS_STORE.ORDER_EXPORT_EXCEL]							: STORE__ORDER_HANDLER.exportExcel,

		//========================================== STORE_ORDER_PRODUCT ==============================================//
		[CF_ACTIONS_STORE.ORDER_PRODUCT_INSERT]							: STORE__ORDER_PRODUCT_HANDLER.insert,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_UPDATE]							: STORE__ORDER_PRODUCT_HANDLER.update,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_REMOVE]							: STORE__ORDER_PRODUCT_HANDLER.remove,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_GET_INFO_AND_GET_LIST]			: STORE__ORDER_PRODUCT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_GET_AMOUNT_BY_PROPERTY]			: STORE__ORDER_PRODUCT_HANDLER.getAmountByProperty,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_GET_LIST_BY_PROPERTY]			: STORE__ORDER_PRODUCT_HANDLER.getListByProperty,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL]		: STORE__ORDER_PRODUCT_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_IMPORT_FROM_EXCEL]				: STORE__ORDER_PRODUCT_HANDLER.importFromExcel,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_EXPORT_EXCEL]					: STORE__ORDER_PRODUCT_HANDLER.exportExcel,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_EXPORT_EXCEL_BY_FILTER]			: STORE__ORDER_PRODUCT_HANDLER.exportExcelByFilter,
		[CF_ACTIONS_STORE.ORDER_PRODUCT_ANALYSE_PRIME_COST]		 		: STORE__ORDER_PRODUCT_HANDLER.analysePrimeCostOfAllVouchers,

		//==========================================  STORE_VOUCHER ==============================================//
		[CF_ACTIONS_STORE.VOUCHER_INSERT]								: STORE__VOUCHER_HANDLER.insert,
		[CF_ACTIONS_STORE.VOUCHER_UPDATE]								: STORE__VOUCHER_HANDLER.update,
		[CF_ACTIONS_STORE.VOUCHER_REMOVE]								: STORE__VOUCHER_HANDLER.remove,
		[CF_ACTIONS_STORE.VOUCHER_GET_INFO_AND_GET_LIST]				: STORE__VOUCHER_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_STORE.VOUCHER_DOWNLOAD_TEMPLATE_EXCEL]				: STORE__VOUCHER_HANDLER.downloadTemplateExcel,
		[CF_ACTIONS_STORE.VOUCHER_IMPORT_FROM_EXCEL]					: STORE__VOUCHER_HANDLER.importFromExcel,
		[CF_ACTIONS_STORE.VOUCHER_EXPORT_EXCEL]							: STORE__VOUCHER_HANDLER.exportExcel,
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
		const initQueueEvents = (queue) => {
			queue.on("error", err => {
				console.error({ err });
			})
		}

		const connection = new IORedis({
			host: REDIS_SEPERATOR.HOST,
			port: REDIS_SEPERATOR.PORT,
			...(isProd() && {
				username: REDIS_SEPERATOR.USR,
				password: REDIS_SEPERATOR.PWD,
			}),
			maxRetriesPerRequest: null,
			enableOfflineQueue: false,
		})

		const queue = new Queue("price_analyze", {
			connection,
		})

		this.metadata = {
			...this.metadata,
			queue
		}

		initQueueEvents(queue)
	},

	/**
	* Service stopped lifecycle event handler
	*/
	async stopped() {

	}
}