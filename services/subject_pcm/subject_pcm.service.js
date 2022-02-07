"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_SUBJECT_PCM } 	    = require('./helper/subject_pcm.actions-constant');

const SUBJECT_PCM__PCM_PLAN_REPORT_HANDLER  	 		= require('./handler/subject_pcm.pcm_plan_report');
const SUBJECT_PCM__USER_PCM_PLAN_REPORT_HANDLER  		= require('./handler/subject_pcm.user_pcm_plan_report');
const SUBJECT_PCM__PCM_PLAN_TASK_HANDLER  			 	= require('./handler/subject_pcm.pcm_plan_task');
const SUBJECT_PCM__PCM_PLAN_GROUP_HANDLER  			 	= require('./handler/subject_pcm.pcm_plan_group');
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_HANDLER  		= require('./handler/subject_pcm.pcm_plan_task_comment');

const SUBJECT_PCM__PCM_PLAN_REPORT_COLL			= require('./database/subject_pcm.pcm_plan_report-coll');
const SUBJECT_PCM__PCM_PLAN_TASK_COLL			= require('./database/subject_pcm.pcm_plan_task-coll');
const SUBJECT_PCM__PCM_PLAN_GROUP_COLL			= require('./database/subject_pcm.pcm_plan_group-coll');
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL	= require('./database/subject_pcm.pcm_plan_task_comment-coll');
const SUBJECT_PCM__PCM_PLAN_LOG_COLL			= require('./database/subject_pcm.user_pcm_plan_log-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.SUBJECT_PCM,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(SUBJECT_PCM__PCM_PLAN_REPORT_COLL),  
		DbService(SUBJECT_PCM__PCM_PLAN_TASK_COLL),  
		DbService(SUBJECT_PCM__PCM_PLAN_GROUP_COLL),  
		DbService(SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL),  
		CacheCleaner([CF_DOMAIN_SERVICES.SUBJECT_PCM])
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
		//==========================================  SUBJECT REPORT ACTIONS   ====================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_INSERT]   						: SUBJECT_PCM__PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_UPDATE]   						: SUBJECT_PCM__PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_REMOVE]   						: SUBJECT_PCM__PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]			: SUBJECT_PCM__PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,
	
		//========================================== USER SUBJECT REPORT ACTIONS   ================================
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_INSERT]   					: SUBJECT_PCM__USER_PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_UPDATE]   					: SUBJECT_PCM__USER_PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_REMOVE]   					: SUBJECT_PCM__USER_PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]		: SUBJECT_PCM__USER_PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,

		//========================================== PCM_PLAN_TASK   ==============================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_INSERT]							: SUBJECT_PCM__PCM_PLAN_TASK_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_UPDATE]							: SUBJECT_PCM__PCM_PLAN_TASK_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST]			: SUBJECT_PCM__PCM_PLAN_TASK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_AMOUNT]						: SUBJECT_PCM__PCM_PLAN_TASK_HANDLER.getAmountTask,

		//========================================== PCM_PLAN_GROUP   ==============================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_GROUP_GET_INFO_AND_GET_LIST]			: SUBJECT_PCM__PCM_PLAN_GROUP_HANDLER.getInfoAndGetList,

		//========================================== PCM_PLAN_TASK_COMMENT   =======================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_INSERT]					: SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_UPDATE]					: SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_REMOVE]					: SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_GET_INFO_AND_GET_LIST]	: SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_HANDLER.getInfoAndGetList,
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
