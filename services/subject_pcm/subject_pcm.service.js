"use strict";

const DbService                	    		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    	= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_SUBJECT_PCM } 	    	= require('./helper/subject_pcm.actions-constant');

const PCM_PLAN_REPORT_HANDLER  	 			= require('./handler/subject_pcm.pcm_plan_report');
const USER_PCM_PLAN_REPORT_HANDLER  		= require('./handler/subject_pcm.user_pcm_plan_report');
const PCM_PLAN_TASK_HANDLER  			 	= require('./handler/subject_pcm.pcm_plan_task');
const PCM_PLAN_GROUP_HANDLER  			 	= require('./handler/subject_pcm.pcm_plan_group');
const PCM_COMMENT_HANDLER  				   	= require('./handler/subject_pcm.pcm_comment');
const PCM_COMMENT_REACTION_HANDLER		   	= require('./handler/subject_pcm.pcm_comment_reaction');
const PCM_FILE_HANDLER  				   	= require('./handler/subject_pcm.pcm_file');

module.exports = {
	name: CF_DOMAIN_SERVICES.SUBJECT_PCM,
	mixins: [
		DbService('pcm_plan_reports'),
		DbService('pcm_plan_tasks'),
		DbService('pcm_plan_groups'),
		DbService('pcm_comments'),
		DbService('pcm_files'),
		DbService('pcm_comment_reactions'),
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
		//==========================================  SUBJECT REPORT ACTIONS  ====================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_INSERT]   						: PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_UPDATE]   						: PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_REMOVE]   						: PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]			: PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,

		//========================================== USER SUBJECT REPORT ACTIONS ================================
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_INSERT]   					: USER_PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_UPDATE]   					: USER_PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_REMOVE]   					: USER_PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.USER_PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]		: USER_PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,

		//========================================== PCM_PLAN_TASK ==============================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_INSERT]							: PCM_PLAN_TASK_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_UPDATE]							: PCM_PLAN_TASK_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_UPDATE_STATUS_MUTIPLE]			: PCM_PLAN_TASK_HANDLER.updateStatusMutiple,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST]			: PCM_PLAN_TASK_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_AMOUNT]						: PCM_PLAN_TASK_HANDLER.getAmountTask,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_BADGE_BIDDING]				: PCM_PLAN_TASK_HANDLER.getBadgeBidding,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_SEND_EMAIL_TO_MEMBER_IN_TASK]		: PCM_PLAN_TASK_HANDLER.sendEmailToMembersInTask,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_TASK_OF_COMPANY_OF_ASSIGNEE]  : PCM_PLAN_TASK_HANDLER.getAmountTaskOfCompanyOfAssignee,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_AMOUNT_TASK_OF_PROJECT]  		: PCM_PLAN_TASK_HANDLER.getAmountTaskByProjects,

		//========================================== PCM_PLAN_GROUP ==============================================
		[CF_ACTIONS_SUBJECT_PCM.GROUP_INSERT]									: PCM_PLAN_GROUP_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.GROUP_UPDATE]									: PCM_PLAN_GROUP_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.GROUP_REMOVE]									: PCM_PLAN_GROUP_HANDLER.remove,
		[CF_ACTIONS_SUBJECT_PCM.GROUP_REMOVE_MANY]								: PCM_PLAN_GROUP_HANDLER.removeMany,
		[CF_ACTIONS_SUBJECT_PCM.GROUP_GET_INFO_AND_GET_LIST]					: PCM_PLAN_GROUP_HANDLER.getInfoAndGetList,

		//========================================== PCM_PLAN_TASK_COMMENT   =======================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_INSERT]					: PCM_COMMENT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_UPDATE]					: PCM_COMMENT_HANDLER.update,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_UPDATE_MARK]				: PCM_COMMENT_HANDLER.updateMarkResponse,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_REMOVE]					: PCM_COMMENT_HANDLER.delete,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_GET_INFO_AND_GET_LIST]	: PCM_COMMENT_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_SEARCH_BY_ID]				: PCM_COMMENT_HANDLER.searchCommentById,

		//========================================== PCM_PLAN_TASK_COMMENT REACTION =======================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_REACTION]					: PCM_COMMENT_REACTION_HANDLER.reaction,
		[CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_COMMENT_REACTION_GET_LIST]		: PCM_COMMENT_REACTION_HANDLER.getListReaction,

		//========================================== PCM_FILE =======================================
		[CF_ACTIONS_SUBJECT_PCM.PCM_FILE_GET_INFO_AND_GET_LIST]					: PCM_FILE_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_SUBJECT_PCM.PCM_FILE_GROUP_BY_DATE]							: PCM_FILE_HANDLER.getListFilesGroupByDate,
		[CF_ACTIONS_SUBJECT_PCM.PCM_FILE_GROUP_BY_CONTRACT]						: PCM_FILE_HANDLER.getListFilesGroupByContract,
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
