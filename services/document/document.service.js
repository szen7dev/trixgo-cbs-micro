"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_DOCUMENT } 	        = require('./helper/document.actions-constant');

/**
 * HANDLERS
 */
const DOCUMENT__DOC_HANDLER    			= require('./handler/document.doc-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.DOCUMENT,
	mixins: [
		DbService('document_doc'),
		DbService('document_package'),
		DbService('doctype'),
		DbService('users'),
		CacheCleaner([CF_DOMAIN_SERVICES.DOCUMENT])
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
		// ======================  CONVERSATION ===========================

		// Thêm cuộc hội thoại mới
		[CF_ACTIONS_DOCUMENT.INSERT_DOCUMENT] 		            			: DOCUMENT__DOC_HANDLER.insertDoc,

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
