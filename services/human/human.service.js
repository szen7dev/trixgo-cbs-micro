"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_HUMAN } 	        	= require('./helper/human.actions-constant');

/**
 * HANDLERS
 */
const HUMAN_HANDLER    					= require('./handler/human.contact_document-handler');


module.exports = {
	name: CF_DOMAIN_SERVICES.DOCUMENT,
	mixins: [
		DbService('contact_document'),
		CacheCleaner([CF_DOMAIN_SERVICES.HUMAN])
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
		// ======================  HUMAN ===========================

		// Danh sách hồ sơ nhân sự sắp hết hạn
		[CF_ACTIONS_HUMAN.GET_LIST_CONTACT_BY_EXPIRE_DOCUMENT]	: HUMAN_HANDLER.getListContactByExpireDocument,
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
