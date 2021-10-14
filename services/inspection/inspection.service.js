"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_INSPECTION } 	    = require('./helper/inspection.actions-constant');
const INSPECTION__TEMPLATE_DOC_HANLDER  = require('./handler/inspection.template_doc-hanlder');
const INSPECTION__TEMPLATE_DOC_COLL     = require('./database/inspection.template_doc-coll');

const INSPECTION__TEMPLATE_CHECKLIST_HANLDER  	= require('./handler/inspection.template_checklist-hanlder');
const INSPECTION__TEMPLATE_DOC_REACTION_HANLDER = require('./handler/inspection.template_doc_reaction-hanlder');
const INSPECTION__TEMPLATE_DOC_COMMENT_HANLDER  = require('./handler/inspection.template_doc_comment-hanlder');
const INSPECTION__AREA_HANLDER 					= require('./handler/inspection.area-hanlder');
const INSPECTION__DOCS_HANLDER 					= require('./handler/inspection.doc-hanlder');


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
		// Action inspection template docs
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_GET_LIST] 		: INSPECTION__TEMPLATE_DOC_HANLDER.getList,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_INSERT	] 		: INSPECTION__TEMPLATE_DOC_HANLDER.insertDoc,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_UPDATE	] 		: INSPECTION__TEMPLATE_DOC_HANLDER.updateDoc,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_REMOVE	] 		: INSPECTION__TEMPLATE_DOC_HANLDER.removeDoc,
		
		// Action inspection template checklist
		[CF_ACTIONS_INSPECTION.TEMPLATE_CHECKLIST_INSERT]   : INSPECTION__TEMPLATE_CHECKLIST_HANLDER.insertChecklist,
		[CF_ACTIONS_INSPECTION.TEMPLATE_CHECKLIST_UPDATE]   : INSPECTION__TEMPLATE_CHECKLIST_HANLDER.updateChecklist,
		[CF_ACTIONS_INSPECTION.TEMPLATE_CHECKLIST_REMOVE]   : INSPECTION__TEMPLATE_CHECKLIST_HANLDER.removeChecklist,
		[CF_ACTIONS_INSPECTION.TEMPLATE_CHECKLIST_LIST]   	: INSPECTION__TEMPLATE_CHECKLIST_HANLDER.getListChecklist,

		// Action inspection template reaction
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_REACTION_INSERT] : INSPECTION__TEMPLATE_DOC_REACTION_HANLDER.insertReaction,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_REACTION_REMOVE] : INSPECTION__TEMPLATE_DOC_REACTION_HANLDER.removeReaction,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_REACTION_LIST]   : INSPECTION__TEMPLATE_DOC_REACTION_HANLDER.listReaction,

		// Action inspection template comment
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_COMMENT_INSERT] : INSPECTION__TEMPLATE_DOC_COMMENT_HANLDER.insertComment,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_COMMENT_UPDATE] : INSPECTION__TEMPLATE_DOC_COMMENT_HANLDER.updateComment,
		[CF_ACTIONS_INSPECTION.TEMPLATE_DOC_COMMENT_LIST]   : INSPECTION__TEMPLATE_DOC_COMMENT_HANLDER.listComment,

		// Action inspection area
		[CF_ACTIONS_INSPECTION.AREA_INSERT]   : INSPECTION__AREA_HANLDER.insertArea,
		[CF_ACTIONS_INSPECTION.AREA_UPDATE]   : INSPECTION__AREA_HANLDER.updateArea,
		[CF_ACTIONS_INSPECTION.AREA_REMOVE]   : INSPECTION__AREA_HANLDER.removeArea,
		[CF_ACTIONS_INSPECTION.AREA_LIST]  	  : INSPECTION__AREA_HANLDER.listArea,

		// Action inspection docs
		[CF_ACTIONS_INSPECTION.DOCS_INSERT]   : INSPECTION__DOCS_HANLDER.insertDoc,
		[CF_ACTIONS_INSPECTION.DOCS_UPDATE]   : INSPECTION__DOCS_HANLDER.updateDoc,
		[CF_ACTIONS_INSPECTION.DOCS_REMOVE]   : INSPECTION__DOCS_HANLDER.removeDoc,
		[CF_ACTIONS_INSPECTION.DOCS_LIST]  	  : INSPECTION__DOCS_HANLDER.getList,
		
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
