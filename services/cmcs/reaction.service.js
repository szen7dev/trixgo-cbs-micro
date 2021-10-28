"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 	        = require('./helper/reaction.actions-constant');

module.exports = {
	name: CF_DOMAIN_SERVICES.REACTION,
	mixins: [
		// gọi tất cả các function dùng ở đây
		// DbService(REACTION__REACTION_COLL),  
		// DbService(REACTION__COMMENT_COLL),  
		// CacheCleaner([CF_DOMAIN_SERVICES.REACTION])
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
		//==========================================   REACTION ACTIONS   ================================
		// [CF_ACTIONS_REACTION.REACTION_GET_LIST ] 	: REACTION__REACTION_HANDLER.getList,
		// [CF_ACTIONS_REACTION.REACTION_INSERT ] 		       : REACTION__REACTION_HANDLER.insertReaction,
		//==========================================   COMMENT_FILE_CORE ACTIONS   ================================
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
