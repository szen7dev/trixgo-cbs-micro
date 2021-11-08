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
const DOCUMENT__PACKAGE_HANDLER    		= require('./handler/document.package-handler');


module.exports = {
	name: CF_DOMAIN_SERVICES.DOCUMENT,
	mixins: [
		DbService('document_doc'),
		DbService('document_file'),
		DbService('document_user'),
		DbService('document_package'),
		DbService('document_storage'),
		DbService('document_doctype'),
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
		// ======================  DOCUMENT ===========================

		// Tạo mới văn bản
		[CF_ACTIONS_DOCUMENT.INSERT_DOCUMENT]				: DOCUMENT__DOC_HANDLER.insertDocument,

		// Cập nhật văn bản
		[CF_ACTIONS_DOCUMENT.UPDATE_DOCUMENT]				: DOCUMENT__DOC_HANDLER.updateDocument,

		// Xóa văn bản
		[CF_ACTIONS_DOCUMENT.DELETE_DOCUMENT]				: DOCUMENT__DOC_HANDLER.deleteDocument,

		// Danh sách hồ sơ văn bản
		[CF_ACTIONS_DOCUMENT.GET_LIST_DOCUMENT]				: DOCUMENT__DOC_HANDLER.getListDocument,

		// Danh sách gói thầu
		[CF_ACTIONS_DOCUMENT.GET_LIST_PACKAGE]				: DOCUMENT__PACKAGE_HANDLER.getListPackage,

		// Danh sách phân loại hồ sơ trong gói thầu
		[CF_ACTIONS_DOCUMENT.GET_LIST_DOCTYPE_BY_PACKAGE]	: DOCUMENT__DOC_HANDLER.getListDoctypeByPackage,

		// Danh sách tính chất văn bản
		[CF_ACTIONS_DOCUMENT.GET_LIST_DOCTYPE]				: DOCUMENT__DOC_HANDLER.getListDoctype,

		// Danh sách nơi lưu trữ văn bản
		[CF_ACTIONS_DOCUMENT.GET_LIST_STORAGE]				: DOCUMENT__DOC_HANDLER.getListStorage,
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
