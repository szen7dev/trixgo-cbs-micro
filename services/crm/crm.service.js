"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CRM }				=	 require('./helper/crm.actions-constant');

/**
 * HANDLERS
 */
const CRM_GROW_TRACK_HANDLER			= require('./handler/crm.grow_track-handler');

/**
 * COLLECTIONS
 */
const CRM_GROW_TRACK_COLL 				= require('./database/crm.grow_track-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.TIMESHEET,
	mixins: [
		DbService(CRM_GROW_TRACK_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.CRM])
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
		// ==================== EXPERT TIMESHEET ACTIONS ======================== //
		[CF_ACTIONS_CRM.CRM_INSERT] : CRM_GROW_TRACK_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_UPDATE] : CRM_GROW_TRACK_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_REMOVE] : CRM_GROW_TRACK_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_GET_INFO_AND_GET_LIST] : CRM_GROW_TRACK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_GET_LIST_BY_PROPERTY] : CRM_GROW_TRACK_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_EXPORT_EXCEL] : CRM_GROW_TRACK_HANDLER.exportExcel,

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
}