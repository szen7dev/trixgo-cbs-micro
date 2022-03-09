"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_DATAHUB } 	       	= require('./helper/datahub.actions-constant');

const DATAHUB_TYPE_COLL					= require('./database/datahub_type-coll');
const DATAHUB_PROJECT_COLL				= require('./database/datahub_project-coll');
const DATAHUB_PACKAGE_COLL				= require('./database/datahub_package-coll');
const DATAHUB_FINREPORT_COLL			= require('./database/datahub_finreport-coll');
const DATAHUB_CONTRACTOR_COLL			= require('./database/datahub_contractor-coll');
const DATAHUB_PROFILE_COLL				= require('./database/datahub_profile-coll');

const DATAHUB_TYPE_HANDLER   			= require('./handler/datahub.datahub_type-handler');
const DATAHUB_PROJECT_HANDLER   		= require('./handler/datahub.datahub_project-handler');
const DATAHUB_PACKAGE_HANDLER   		= require('./handler/datahub.datahub_package-handler');
const DATAHUB_FINREPORT_HANDLER   		= require('./handler/datahub.datahub_finreport-handler');
const DATAHUB_CONTRACTOR_HANDLER   		= require('./handler/datahub.datahub_contractor-handler');
const DATAHUB_PROFILE_HANDLER   		= require('./handler/datahub.datahub_profile-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.DATAHUB,
	mixins: [
		DbService(DATAHUB_TYPE_COLL),  
		DbService(DATAHUB_PROJECT_COLL),  
		DbService(DATAHUB_PACKAGE_COLL),  
		DbService(DATAHUB_FINREPORT_COLL), 
		DbService(DATAHUB_CONTRACTOR_COLL), 
		DbService(DATAHUB_PROFILE_HANDLER), 
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
		//==========================================   DATAHUB TYPE   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_INSERT]   			 	: DATAHUB_TYPE_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_UPDATE]   			 	: DATAHUB_TYPE_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_REMOVE]				: DATAHUB_TYPE_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_TYPE_GET_INFO_AND_GET_LIST]	: DATAHUB_TYPE_HANDLER.getInfoAndGetList,

		//==========================================   DATAHUB PROJECT   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_PROJECT_INSERT]   			 	: DATAHUB_PROJECT_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_PROJECT_UPDATE]   			 	: DATAHUB_PROJECT_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_PROJECT_REMOVE]					: DATAHUB_PROJECT_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_PROJECT_GET_INFO_AND_GET_LIST]	: DATAHUB_PROJECT_HANDLER.getInfoAndGetList,

		//==========================================   DATAHUB PACKAGE   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_PACKAGE_INSERT]   			 	: DATAHUB_PACKAGE_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_PACKAGE_UPDATE]   			 	: DATAHUB_PACKAGE_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_PACKAGE_REMOVE]					: DATAHUB_PACKAGE_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_PACKAGE_GET_INFO_AND_GET_LIST]	: DATAHUB_PACKAGE_HANDLER.getInfoAndGetList,

		//==========================================   DATAHUB FINREPORT   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_FINREPORT_INSERT]   			 	: DATAHUB_FINREPORT_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_FINREPORT_UPDATE]   			 	: DATAHUB_FINREPORT_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_FINREPORT_REMOVE]					: DATAHUB_FINREPORT_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_FINREPORT_GET_INFO_AND_GET_LIST]	: DATAHUB_FINREPORT_HANDLER.getInfoAndGetList,

		//==========================================   DATAHUB CONTRACTOR   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_CONTRACTOR_INSERT]   			 	: DATAHUB_CONTRACTOR_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_CONTRACTOR_UPDATE]   			 	: DATAHUB_CONTRACTOR_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_CONTRACTOR_REMOVE]					: DATAHUB_CONTRACTOR_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_CONTRACTOR_GET_INFO_AND_GET_LIST]	: DATAHUB_CONTRACTOR_HANDLER.getInfoAndGetList,

		//==========================================   DATAHUB PROFILE   ================================
		[CF_ACTIONS_DATAHUB.DATAHUB_PROFILE_INSERT]   			 	: DATAHUB_PROFILE_HANDLER.insert,
		[CF_ACTIONS_DATAHUB.DATAHUB_PROFILE_UPDATE]   			 	: DATAHUB_PROFILE_HANDLER.update,
		[CF_ACTIONS_DATAHUB.DATAHUB_PROFILE_REMOVE]					: DATAHUB_PROFILE_HANDLER.remove,
		[CF_ACTIONS_DATAHUB.DATAHUB_PROFILE_GET_INFO_AND_GET_LIST]	: DATAHUB_PROFILE_HANDLER.getInfoAndGetList,
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
