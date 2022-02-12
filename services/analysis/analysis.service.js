"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ANALYSIS } 	        = require('./helper/analysis.actions-constant');

/**
 * HANDLERS
 */
const ANALYSIS__HISTORY_TRAFFIC_HANDLER  = require('./handler/analysis.history_traffic-hanlder');
const ANALYSIS__HISTORY_LOG_HANDLER   	 = require('./handler/analysis.history_log-hanlder');

/**
 * COLLECTIONS
 */
const ANALYSIS__HISTORY_TRAFFIC_COLL	= require('./database/analysis.history_traffic-coll');
const ANALYSIS__HISTORY_LOG_COLL	  	= require('./database/analysis.history_log-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.ANALYSIS,
	mixins: [
		DbService('history_traffics'),  
		DbService('history_logs'),  
		CacheCleaner([CF_DOMAIN_SERVICES.ANALYSIS])
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
		//==========================================   HISTORY TRAFFIC ACTIONS   ================================
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_INSERT] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.insert,
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_GET_INFO_AND_GET_LIST] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_STATISTICS_DEVICE_ACCESS_BY_YEAR] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.statisticsDeviceAccessByYear,
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_STATISTICS_BY_DEVICE_ACCESS] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.statisticsByDeviceAccess,
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_STATISTICS_ACCESS_BY_APP] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.statisticsAccessByApp,
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_STATISTICS_ACCESS_BY_COMPANY] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.statisticsAccessByCompany,
		[CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_STATISTICS_ACCESS_BY_APP_AND_DEVICE] : ANALYSIS__HISTORY_TRAFFIC_HANDLER.statisticsAccessByAppAndDevice,
		
		//==========================================   HISTORY LOG ACTIONS   ====================================
		[CF_ACTIONS_ANALYSIS.HISTORY_LOG_INSERT] 				: ANALYSIS__HISTORY_LOG_HANDLER.insert,
		[CF_ACTIONS_ANALYSIS.HISTORY_LOG_GET_INFO_AND_GET_LIST] : ANALYSIS__HISTORY_LOG_HANDLER.getInfoAndGetList,
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
