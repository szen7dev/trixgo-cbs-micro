"use strict";
const { MoleculerClientError } 		= require("moleculer").Errors;
const { ForbiddenError }       		= require("moleculer-web").Errors;
const DbService                		= require("../mixins/db.mixin");
const CacheCleaner                	= require("../mixins/cache.cleaner.mixin");
const CATEGORY_COLL  		   		= require('../database/test/category_coll');
const ObjectID                 		= require('mongoose').Types.ObjectId;
let { CF_SERVICES } 				= require('../config/constants/services');
let { CF_ACTIONS_CATEGORIES } 		= require('../config/constants/actions');
let CATEGORIES_ACTION				= require('../api/categories');

module.exports = {

	name: CF_SERVICES.CATEGORIES,
	mixins: [
		DbService(CATEGORY_COLL), 
		CacheCleaner([CF_SERVICES.CATEGORIES])
	],
	/**
	 	* Service settings
	*/
	settings: {
		fields: ["_id", "name", "products"],
		// populates : {
		// 	"products": {
		// 		action: "users.get",
		// 		params: ["_id"]
		// 	}
		// }
		entityValidator: {
			name: { type: "string"}
		}
	},

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
	
		[CF_ACTIONS_CATEGORIES.CREATE] 		: CATEGORIES_ACTION.create,

		// add product into products cart then insert product
		[CF_ACTIONS_CATEGORIES.ADD_PRODUCT]	: CATEGORIES_ACTION.addProduct,

		[CF_ACTIONS_CATEGORIES.FIND_BY_ID]	: CATEGORIES_ACTION.findById,

		// update add product into categoy
		[CF_ACTIONS_CATEGORIES.UPDATE]		: CATEGORIES_ACTION.update,

		[CF_ACTIONS_CATEGORIES.GET_LIST] 	: CATEGORIES_ACTION.getList,
		
		[CF_ACTIONS_CATEGORIES.REMOVE] 		: CATEGORIES_ACTION.remove,
		
	},

	/**
	 	* Events
	*/
	events: {
		async "some.thing"(ctx) {
			this.logger.info("Something happened", ctx.params);
		}
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
