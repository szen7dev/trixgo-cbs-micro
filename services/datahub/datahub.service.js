"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_DATAHUB } 	       	= require('./helper/datahub.actions-constant');

const DATAHUB_TYPE_COLL					= require('./database/datahub_type-coll');
const DATAHUB_TYPE_HANDLER   			= require('./handler/datahub.datahub_type-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.DATAHUB,
	mixins: [
		DbService(DATAHUB_TYPE_COLL),  
		CacheCleaner([CF_DOMAIN_SERVICES.DATAHUB])
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
		//==========================================   DATAHUB   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_INSERT]   			 	: DATAHUB_TYPE_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_UPDATE]   			 	: DATAHUB_TYPE_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_REMOVE]				: DATAHUB_TYPE_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_GET_INFO_AND_GET_LIST]	: DATAHUB_TYPE_HANDLER.getInfoAndGetList,
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
