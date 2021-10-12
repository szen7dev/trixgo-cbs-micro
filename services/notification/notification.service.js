"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_NOTIFICATION } 	        = require('./helper/notification.actions-constant');
const NOTIFICATION__LOG_HANDLER             = require('./handler/notification.log-handler');
const { LIST_EVENTS_SUBSCRIBE }				= require('./helper/notification.events-constant')
module.exports = {
	name: CF_DOMAIN_SERVICES.NOTIFICATION,
	mixins: [
		DbService('notification_log'),  
		CacheCleaner([CF_DOMAIN_SERVICES.NOTIFICATION])
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
		// [CF_ACTIONS_EXAMPLE.CASE_1_GET_LIST] 		: EXAMPLE__CASE1_HANLDER.getList,
	},

	/**
	* Events
	*/
	events: {
		...LIST_EVENTS_SUBSCRIBE
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
