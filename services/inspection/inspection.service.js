"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_INSPECTION } 	    = require('./helper/inspection.actions-constant');

/**
 * COLLECTIONS
 */
 const INSPECTION__DOC_COMMENT_COLL				= require('./database/inspection.doc_comment-coll');
 const INSPECTION__AREA_COLL					= require('./database/inspection.area-coll');
 const INSPECTION__GROUP_COLL					= require('./database/inspection.group-coll');
 const INSPECTION__AREA_GROUP_COLL				= require('./database/inspection.area_group-coll');
 const INSPECTION__DOCS_COLL					= require('./database/inspection.doc-coll');
 const INSPECTION__DOC_REACTION_COLL			= require('./database/inspection.doc_reaction-coll');
 const INSPECTION__CHECKLIST_COLL				= require('./database/inspection.checklist-coll');

const INSPECTION__DOC_COMMENT_HANLDER  			= require('./handler/inspection.doc_comment-hanlder');
const INSPECTION__AREA_HANLDER 					= require('./handler/inspection.area-hanlder');
const INSPECTION__GROUP_HANLDER 				= require('./handler/inspection.group-hanlder');
const INSPECTION__AREA_GROUP_HANLDER 			= require('./handler/inspection.area_group-hanlder');
const INSPECTION__DOCS_HANLDER 					= require('./handler/inspection.doc-hanlder');
const INSPECTION__DOC_REACTION_HANLDER 			= require('./handler/inspection.doc_reaction-hanlder');
const INSPECTION__CHECKLIST_HANLDER 			= require('./handler/inspection.checklist-hanlder');

module.exports = {
	name: CF_DOMAIN_SERVICES.INSPECTION,
	mixins: [
		//DbService('inspection_template_docs'),  
		DbService(INSPECTION__DOC_COMMENT_COLL),  
		DbService(INSPECTION__AREA_COLL),  
		DbService(INSPECTION__GROUP_COLL),  
		DbService(INSPECTION__AREA_GROUP_COLL),  
		DbService(INSPECTION__DOCS_COLL),  
		DbService(INSPECTION__DOC_REACTION_COLL),  
		DbService(INSPECTION__CHECKLIST_COLL),  
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
		// Action inspection area
		[CF_ACTIONS_INSPECTION.AREA_INSERT]   : INSPECTION__AREA_HANLDER.insert,
		[CF_ACTIONS_INSPECTION.AREA_UPDATE]   : INSPECTION__AREA_HANLDER.update,
		[CF_ACTIONS_INSPECTION.AREA_REMOVE]   : INSPECTION__AREA_HANLDER.remove,
		[CF_ACTIONS_INSPECTION.AREA_LIST]  	  : INSPECTION__AREA_HANLDER.getInfoAndGetList,

		// Action inspection group
		[CF_ACTIONS_INSPECTION.GROUP_INSERT]   : INSPECTION__GROUP_HANLDER.insert,
		[CF_ACTIONS_INSPECTION.GROUP_UPDATE]   : INSPECTION__GROUP_HANLDER.update,
		[CF_ACTIONS_INSPECTION.GROUP_REMOVE]   : INSPECTION__GROUP_HANLDER.remove,
		[CF_ACTIONS_INSPECTION.GROUP_LIST]  	  : INSPECTION__GROUP_HANLDER.getInfoAndGetList,

		// Action inspection area_group
		[CF_ACTIONS_INSPECTION.AREA_GROUP_INSERT]   : INSPECTION__AREA_GROUP_HANLDER.insert,
		[CF_ACTIONS_INSPECTION.AREA_GROUP_UPDATE]   : INSPECTION__AREA_GROUP_HANLDER.update,
		[CF_ACTIONS_INSPECTION.AREA_GROUP_REMOVE]   : INSPECTION__AREA_GROUP_HANLDER.remove,
		[CF_ACTIONS_INSPECTION.AREA_GROUP_LIST]  	: INSPECTION__AREA_GROUP_HANLDER.getInfoAndGetList,

		// Action inspection docs
		[CF_ACTIONS_INSPECTION.DOCS_INSERT]   : INSPECTION__DOCS_HANLDER.insertDoc,
		[CF_ACTIONS_INSPECTION.DOCS_UPDATE]   : INSPECTION__DOCS_HANLDER.updateDoc,
		[CF_ACTIONS_INSPECTION.DOCS_REMOVE]   : INSPECTION__DOCS_HANLDER.removeDoc,
		[CF_ACTIONS_INSPECTION.DOCS_LIST]  	  : INSPECTION__DOCS_HANLDER.getList,
		
		// Action inspection comment
		[CF_ACTIONS_INSPECTION.DOC_COMMENT_INSERT] : INSPECTION__DOC_COMMENT_HANLDER.insertComment,
		[CF_ACTIONS_INSPECTION.DOC_COMMENT_UPDATE] : INSPECTION__DOC_COMMENT_HANLDER.updateComment,
		[CF_ACTIONS_INSPECTION.DOC_COMMENT_REMOVE] : INSPECTION__DOC_COMMENT_HANLDER.removeComment,
		[CF_ACTIONS_INSPECTION.DOC_COMMENT_LIST]   : INSPECTION__DOC_COMMENT_HANLDER.listComment,

		// Action inspection reaction
		[CF_ACTIONS_INSPECTION.DOC_REACTION_INSERT] : INSPECTION__DOC_REACTION_HANLDER.insertReaction,
		[CF_ACTIONS_INSPECTION.DOC_REACTION_REMOVE] : INSPECTION__DOC_REACTION_HANLDER.removeReaction,
		[CF_ACTIONS_INSPECTION.DOC_REACTION_LIST]   : INSPECTION__DOC_REACTION_HANLDER.listReaction,
		
		// Action inspection checklist
		[CF_ACTIONS_INSPECTION.DOC_CHECKLIST_UPDATE]: INSPECTION__CHECKLIST_HANLDER.update,
		[CF_ACTIONS_INSPECTION.DOC_CHECKLIST_LIST]  : INSPECTION__CHECKLIST_HANLDER.getList,
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
