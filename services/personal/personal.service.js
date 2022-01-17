"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_PERSONAL }			= require('./helper/personal.actions-constant');

/**
 * HANDLERS
 */
const FRIEND_REQUEST_HANDLER	= require('./handler/personal.friend_request-handler');

/**
 * COLLECTIONS
 */
const FRIEND_REQUEST_COLL 			= require('./database/personal.friend_request-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.PERSONAL,
	mixins: [
		DbService(FRIEND_REQUEST_COLL),
		CacheCleaner([CF_DOMAIN_SERVICES.PERSONAL])
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
		// ==================== FRIEND REQUEST ========================
		[CF_ACTIONS_PERSONAL.FRIEND_REQUEST_GET_CODE] 	: FRIEND_REQUEST_HANDLER.getCode,
		[CF_ACTIONS_PERSONAL.FRIEND_REQUEST_CHECK_CODE] : FRIEND_REQUEST_HANDLER.checkCodeFriendRequest,
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
