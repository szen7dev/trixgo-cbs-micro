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
const CRM_SEARCH_KEYWORD_HANDLER		= require('./handler/crm.search_keyword-handler');
const CRM_COMBO_HANDLER					= require('./handler/crm.combo-handler');
const CRM_HABIT_HANDLER					= require('./handler/crm.habit-handler');
const CRM_HABIT_TRACK_HANDLER			= require('./handler/crm.habit_track-handler');
const CRM_VNG_FUND_HANDLER				= require('./handler/crm.vng_fund-handler');

/**
 * COLLECTIONS
 */
const CRM_GROW_TRACK_COLL 				= require('./database/crm.grow_track-coll');
const CRM_SURVEY_COLL 					= require('./database/crm.survey-coll');
const CRM_SURVEY_RESULT_COLL 			= require('./database/crm.survey_result-coll');
const CRM_SEARCH_KEYWORD_COLL 			= require('./database/crm.search_keyword-coll');
const CRM_COMBO_COLL 					= require('./database/crm.combo-coll');
const CRM_HABIT_COLL 					= require('./database/crm.habit-coll');
const CRM_HABIT_TRACK_COLL 				= require('./database/crm.habit_track-coll');
const CRM_VNG_FUND_COLL 				= require('./database/crm.vng_fund-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.CRM,
	mixins: [
		DbService(CRM_GROW_TRACK_COLL),
		DbService(CRM_SURVEY_COLL),
		DbService(CRM_SURVEY_RESULT_COLL),
		DbService(CRM_SEARCH_KEYWORD_COLL),
		DbService(CRM_COMBO_COLL),
		DbService(CRM_HABIT_COLL),
		DbService(CRM_HABIT_TRACK_COLL),
		DbService(CRM_VNG_FUND_COLL),
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

		// ==================== CRM_HABIT ======================== //
		[CF_ACTIONS_CRM.CRM_HABIT_INSERT] : CRM_HABIT_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_HABIT_UPDATE] : CRM_HABIT_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_HABIT_REMOVE] : CRM_HABIT_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_HABIT_GET_INFO_AND_GET_LIST] : CRM_HABIT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_HABIT_GET_LIST_BY_PROPERTY] : CRM_HABIT_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_HABIT_EXPORT_EXCEL] : CRM_HABIT_HANDLER.exportExcel,

		// ==================== CRM_HABIT_TRACK ======================== //
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_INSERT] : CRM_HABIT_TRACK_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_UPDATE] : CRM_HABIT_TRACK_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_UPDATE_MANY] : CRM_HABIT_TRACK_HANDLER.updateMany,
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_REMOVE] : CRM_HABIT_TRACK_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_GET_INFO_AND_GET_LIST] : CRM_HABIT_TRACK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_GET_LIST_BY_PROPERTY] : CRM_HABIT_TRACK_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_HABIT_TRACK_EXPORT_EXCEL] : CRM_HABIT_TRACK_HANDLER.exportExcel,

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

		// ==================== CRM_SEARCH_KEYWORD ======================== //
		[CF_ACTIONS_CRM.CRM_SEARCH_KEYWORD_INSERT] : CRM_SEARCH_KEYWORD_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_SEARCH_KEYWORD_UPDATE] : CRM_SEARCH_KEYWORD_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_SEARCH_KEYWORD_REMOVE] : CRM_SEARCH_KEYWORD_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_SEARCH_KEYWORD_GET_INFO_AND_GET_LIST] : CRM_SEARCH_KEYWORD_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_SEARCH_KEYWORD_GET_LIST_BY_PROPERTY] : CRM_SEARCH_KEYWORD_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_SEARCH_KEYWORD_EXPORT_EXCEL] : CRM_SEARCH_KEYWORD_HANDLER.exportExcel,

		// ==================== CRM_COMBO ======================== //
		[CF_ACTIONS_CRM.CRM_COMBO_INSERT] : CRM_COMBO_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_COMBO_UPDATE] : CRM_COMBO_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_COMBO_REMOVE] : CRM_COMBO_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_COMBO_GET_INFO_AND_GET_LIST] : CRM_COMBO_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_COMBO_GET_LIST_BY_PROPERTY] : CRM_COMBO_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_COMBO_EXPORT_EXCEL] : CRM_COMBO_HANDLER.exportExcel,
		[CF_ACTIONS_CRM.CRM_COMBO_BEST_SELLER] : CRM_COMBO_HANDLER.bestSeller,

		// ==================== CRM_VNG_FUND ======================== //
		[CF_ACTIONS_CRM.CRM_VNG_FUND_INSERT] : CRM_VNG_FUND_HANDLER.insert,
		[CF_ACTIONS_CRM.CRM_VNG_FUND_UPDATE] : CRM_VNG_FUND_HANDLER.update,
		[CF_ACTIONS_CRM.CRM_VNG_FUND_REMOVE] : CRM_VNG_FUND_HANDLER.remove,
		[CF_ACTIONS_CRM.CRM_VNG_FUND_GET_INFO_AND_GET_LIST] : CRM_VNG_FUND_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_CRM.CRM_VNG_FUND_GET_LIST_BY_PROPERTY] : CRM_VNG_FUND_HANDLER.getListByProperty,
		[CF_ACTIONS_CRM.CRM_VNG_FUND_EXPORT_EXCEL] : CRM_VNG_FUND_HANDLER.exportExcel,
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