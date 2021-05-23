"use strict";
const DbService                		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CATEGORIES } 	= require('./helper/actions.constant.category');
const CATEGORIES_ACTION				= require('./category.handler');
const CATEGORY_COLL					= require('./database/category_coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.CATEGORIES,
	mixins: [
		// DbService(CATEGORY_COLL), 
		DbService('categories'), 
		CacheCleaner([CF_DOMAIN_SERVICES.CATEGORIES])
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
		// emit event: emit [service.event_name] 
		async "nguyen_dinh"(ctx) {
			this.logger.in1fo("Something happened", ctx.params);
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
