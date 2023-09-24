"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_TIMESHEET }			= require('./helper/timesheet.actions-constant');

/**
 * HANDLERS
 */
const EXPERT_TIMESHEET_HANDLER			= require('./handler/timesheet.expert_timesheet-handler');

/**
 * COLLECTIONS
 */
const EXPERT_TIMESHEET_COLL 			= require('./database/timesheet.expert_timesheet-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.TIMESHEET,
	mixins: [
		DbService(EXPERT_TIMESHEET_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.TIMESHEET])
    ],

	/**
	* Service metadata
	*/
	metadata: {

	},

	/**
	* Service dependencies
	*/
	dependencies: [
		CF_DOMAIN_SERVICES.AUTH
	],

	/**
	* Actions
	*/
	actions: {
		// ==================== EXPERT TIMESHEET ACTIONS ========================
		[CF_ACTIONS_TIMESHEET.EXPERT_TIMESHEET_GET_INFO_AND_GET_LIST] : EXPERT_TIMESHEET_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_TIMESHEET.EXPERT_TIMESHEET_INSERT] : EXPERT_TIMESHEET_HANDLER.insert,
		[CF_ACTIONS_TIMESHEET.EXPERT_TIMESHEET_UPDATE] : EXPERT_TIMESHEET_HANDLER.update,
		[CF_ACTIONS_TIMESHEET.EXPERT_TIMESHEET_REMOVE] : EXPERT_TIMESHEET_HANDLER.remove,
		[CF_ACTIONS_TIMESHEET.EXPERT_TIMESHEET_GET_LIST_BY_PROPERTY] : EXPERT_TIMESHEET_HANDLER.getListByProperty,
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
