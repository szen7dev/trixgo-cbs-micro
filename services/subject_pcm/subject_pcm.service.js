"use strict";

const DbService                	    					= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    				= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    				= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_SUBJECT_PCM } 	    				= require('./helper/subject_pcm.actions-constant');

const PCM_PLAN_REPORT_HANDLER  	 			= require('./handler/subject_pcm.pcm_plan_report');
const USER_PCM_PLAN_REPORT_HANDLER  		= require('./handler/subject_pcm.user_pcm_plan_report');
const PCM_PLAN_TASK_HANDLER  			 	= require('./handler/subject_pcm.pcm_plan_task');
const PCM_PLAN_GROUP_HANDLER  			 	= require('./handler/subject_pcm.pcm_plan_group');
const PCM_COMMENT_HANDLER  				   	= require('./handler/subject_pcm.pcm_comment');

module.exports = {
	name: CF_DOMAIN_SERVICES.SUBJECT_PCM,
	mixins: [
		DbService('pcm_plan_reports'),  
		DbService('pcm_plan_tasks'),  
		DbService('pcm_plan_groups'),  
		DbService('pcm_comments'), 
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
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_INSERT]   						: PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_UPDATE]   						: PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_REMOVE]   						: PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]			: PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,
	
		//========================================== USER SUBJECT REPORT ACTIONS   ================================
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_INSERT]   					: USER_PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_UPDATE]   					: USER_PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_REMOVE]   					: USER_PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]		: USER_PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,

		//========================================== PCM_PLAN_TASK   ==============================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_INSERT]							: PCM_PLAN_TASK_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_UPDATE]							: PCM_PLAN_TASK_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_UPDATE_STATUS_MUTIPLE]			: PCM_PLAN_TASK_HANDLER.updateStatusMutiple,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST]			: PCM_PLAN_TASK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_AMOUNT]						: PCM_PLAN_TASK_HANDLER.getAmountTask,

		//========================================== PCM_PLAN_GROUP   ==============================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_GROUP_GET_INFO_AND_GET_LIST]			: PCM_PLAN_GROUP_HANDLER.getInfoAndGetList,

		//========================================== PCM_PLAN_TASK_COMMENT   =======================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_INSERT]					: PCM_COMMENT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_UPDATE]					: PCM_COMMENT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_UPDATE_MARK]				: PCM_COMMENT_HANDLER.updateMarkResponse,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_REMOVE]					: PCM_COMMENT_HANDLER.delete,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_GET_INFO_AND_GET_LIST]	: PCM_COMMENT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_SEARCH_BY_ID]				: PCM_COMMENT_HANDLER.searchCommentById,
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
