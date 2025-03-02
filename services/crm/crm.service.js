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
const CRM_SURVEY_HANDLER				= require('./handler/crm.survey-handler');
const CRM_SURVEY_RESULT_HANDLER			= require('./handler/crm.survey_result-handler');

/**
 * COLLECTIONS
 */
const CRM_GROW_TRACK_COLL 				= require('./database/crm.grow_track-coll');
const CRM_SURVEY_COLL 					= require('./database/crm.survey-coll');
const CRM_SURVEY_RESULT_COLL 			= require('./database/crm.survey_result-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.CRM,
	mixins: [
		DbService(CRM_GROW_TRACK_COLL),
		DbService(CRM_SURVEY_COLL),
		DbService(CRM_SURVEY_RESULT_COLL),
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
		// ==================== CRM_GROW_TRACK ======================== //
		[CF_ACTIONS_CRM.CRM_GROW_TRACK_INSERT] : CRM_GROW_TRACK_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_GROW_TRACK_UPDATE] : CRM_GROW_TRACK_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_GROW_TRACK_REMOVE] : CRM_GROW_TRACK_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_GROW_TRACK_GET_INFO_AND_GET_LIST] : CRM_GROW_TRACK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_GROW_TRACK_GET_LIST_BY_PROPERTY] : CRM_GROW_TRACK_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_GROW_TRACK_EXPORT_EXCEL] : CRM_GROW_TRACK_HANDLER.exportExcel,

		// ==================== CRM_SURVEY ======================== //
		[CF_ACTIONS_CRM.CRM_SURVEY_INSERT] : CRM_SURVEY_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_SURVEY_UPDATE] : CRM_SURVEY_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_SURVEY_REMOVE] : CRM_SURVEY_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_SURVEY_GET_INFO_AND_GET_LIST] : CRM_SURVEY_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_SURVEY_GET_LIST_BY_PROPERTY] : CRM_SURVEY_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_SURVEY_EXPORT_EXCEL] : CRM_SURVEY_HANDLER.exportExcel,

		// ==================== CRM_SURVEY_RESULT ======================== //
		[CF_ACTIONS_CRM.CRM_SURVEY_RESULT_INSERT] : CRM_SURVEY_RESULT_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_SURVEY_RESULT_UPDATE] : CRM_SURVEY_RESULT_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_SURVEY_RESULT_REMOVE] : CRM_SURVEY_RESULT_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_SURVEY_RESULT_GET_INFO_AND_GET_LIST] : CRM_SURVEY_RESULT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_SURVEY_RESULT_GET_LIST_BY_PROPERTY] : CRM_SURVEY_RESULT_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_SURVEY_RESULT_EXPORT_EXCEL] : CRM_SURVEY_RESULT_HANDLER.exportExcel,

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