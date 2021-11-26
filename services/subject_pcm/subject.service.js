"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_SUBJECT } 	       	= require('./helper/subject.actions-constant');

const SUBJECT__PCM_PLAN_REPORT_HANDLER  = require('./handler/subject.pcm_plan_report');
const SUBJECT__PCM_PLAN_REPORT_COLL		= require('./database/subject.pcm_plan_report-coll');


module.exports = {
	name: CF_DOMAIN_SERVICES.SUBJECT,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(SUBJECT__PCM_PLAN_REPORT_COLL),  
		
		CacheCleaner([CF_DOMAIN_SERVICES.SUBJECT])
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
		//==========================================   TRAINING SUBJECT ACTIONS   ================================
		[CF_ACTIONS_SUBJECT.SUBJECT__PCM_PLAN_REPORT_INSERT]   				: SUBJECT__PCM_PLAN_REPORT_HANDLER.insert,
		[CF_ACTIONS_SUBJECT.SUBJECT__PCM_PLAN_REPORT_UPDATE]   				: SUBJECT__PCM_PLAN_REPORT_HANDLER.update,
		[CF_ACTIONS_SUBJECT.SUBJECT__PCM_PLAN_REPORT_REMOVE]   				: SUBJECT__PCM_PLAN_REPORT_HANDLER.remove,
		[CF_ACTIONS_SUBJECT.SUBJECT__PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST]	: SUBJECT__PCM_PLAN_REPORT_HANDLER.getInfoAndGetList,
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
