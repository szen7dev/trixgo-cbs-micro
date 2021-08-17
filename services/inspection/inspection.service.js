"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_INSPECTION } 	    = require('./helper/inspection.actions-constant');
const INSPECTION__TEMPLATE_DOC_HANLDER  = require('./handler/inspection.template_doc-hanlder');
const INSPECTION__TEMPLATE_DOC_COLL     = require('./database/inspection.template_doc-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.INSPECTION,
	mixins: [
		//DbService('inspection_template_docs'),  
		DbService(INSPECTION__TEMPLATE_DOC_COLL),  
		CacheCleaner([CF_DOMAIN_SERVICES.INSPECTION])
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
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_GET_LIST				] 		: INSPECTION__TEMPLATE_DOC_HANLDER.getList,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_INSERT					] 		: INSPECTION__TEMPLATE_DOC_HANLDER.insertDoc,
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
