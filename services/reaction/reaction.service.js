"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 	        = require('./helper/reaction.actions-constant');
const REACTION__COMMENT_HANDLER        	= require('./handler/reaction.comment_core-hanlder');
const REACTION__REACTION_HANDLER      	= require('./handler/reaction.reaction-hanlder');

const REACTION__REACTION_CORE_COLL			= require('./database/reaction.reaction_core-coll');
const REACTION__COMMENT_CORE_COLL			= require('./database/reaction.comment_core-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.REACTION,
	mixins: [
		// gọi tất cả các function dùng ở đây
		DbService(REACTION__REACTION_CORE_COLL),  
		DbService(REACTION__COMMENT_CORE_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.REACTION])
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
		[CF_ACTIONS_REACTION.REACTION_INSERT] 			: REACTION__REACTION_HANDLER.insertReaction,

		//==========================================   COMMENT_CORE   =====================================
		[CF_ACTIONS_REACTION.COMMENT_CORE_INSERT] 				 : REACTION__COMMENT_HANDLER.insert,
		[CF_ACTIONS_REACTION.COMMENT_CORE_UPDATE] 				 : REACTION__COMMENT_HANDLER.update,
		[CF_ACTIONS_REACTION.COMMENT_CORE_GET_INFO_AND_GET_LIST ]: REACTION__COMMENT_HANDLER.getInfoAndGetList,
		//==========================================   COMMENT_FILE_CORE ACTIONS   =======================
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
