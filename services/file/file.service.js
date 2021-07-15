"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 	        = require('./helper/file.actions-constant');
const FILE__CORE_HANLDER            = require('./handler/file.core-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.FILE,
	mixins: [
		DbService('file_cores'),  
		CacheCleaner([CF_DOMAIN_SERVICES.FILE])
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
		[CF_ACTIONS_FILE.INSERT_FILE] 								: FILE__CORE_HANLDER.insert,
		[CF_ACTIONS_FILE.UPDATE_STATUS_FILE] 						: FILE__CORE_HANLDER.updateStatus,
		[CF_ACTIONS_FILE.GET_INFO_FILE] 							: FILE__CORE_HANLDER.getInfoFile,
		[CF_ACTIONS_FILE.GET_LIST_FILE_OF_USER_WITH_STATUS] 		: FILE__CORE_HANLDER.getListFileWithStatus,
		[CF_ACTIONS_FILE.GENERATE_LINK_S3] 							: FILE__CORE_HANLDER.generateLinkS3,
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
