"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CONTACT }			= require('./helper/human.actions-constant');

/**
 * HANDLERS
 */
const CONTACT_HANDLER					= require('./handler/human.contact-hanlder');
const CONTACT_DOCUMENT_HANDLER			= require('./handler/human.contact_document-handler');

/**
 * COLLECTIONS
 */
const CONTACT_COLL 						= require('./database/human.contact-coll');
const CONTACT_DOCUMENT_COLL 			= require('./database/human.contact_document-coll');


module.exports = {
	name: CF_DOMAIN_SERVICES.HUMAN,
	mixins: [
		DbService(CONTACT_COLL),
		DbService(CONTACT_DOCUMENT_COLL),
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
		// ==================== CONTACT DOCUMENT ACTIONS ========================
		[CF_ACTIONS_CONTACT.GET_LIST_CONTACT_DOCUMENT]				: CONTACT_DOCUMENT_HANDLER.getListContactDocument,
		[CF_ACTIONS_CONTACT.INFO_CONTACT_DOCUMENT]					: CONTACT_DOCUMENT_HANDLER.getInfoContactDocument,

		// ==================== CONTACT ACTIONS ========================
		[CF_ACTIONS_CONTACT.GET_LIST_CONTACT] 						: CONTACT_HANDLER.getListContact,
		[CF_ACTIONS_CONTACT.INFO_CONTACT] 							: CONTACT_HANDLER.getInfoContact,
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
