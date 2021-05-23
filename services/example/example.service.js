"use strict";
const DbService                		= require("../../tools/mixins/db.mixin");
const CacheCleaner                	= require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		= require('../gateway/helper/domain.constant');
const { CF_ACTIONS_EXAMPLE } 	= require('./helper/actions.constant.example');
const CATEGORIES_HANDLER			= require('./example.handler');
const CATEGORY_COLL					= require('./database/example.abc-coll');

module.exports = {
	name: CF_DOMAIN_SERVICES.EXAMPLES,
	mixins: [
		// DbService(CATEGORY_COLL), 
		DbService('categories'), 
		CacheCleaner([CF_DOMAIN_SERVICES.EXAMPLES])
	],
	/**
	 	* Service settings
	*/
	settings: {
		fields: ["_id", "name", "products"],
		populates : {
			"products": {
				action: "products.get",
				params: ["name"]
			}
		},
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
	
		[CF_ACTIONS_EXAMPLE.CREATE] 		: CATEGORIES_HANDLER.create,
		[CF_ACTIONS_EXAMPLE.FIND_BY_ID]		: CATEGORIES_HANDLER.findById,
	},

	/**
	 	* Events
	*/
	events: {
		// emit event: emit [service.event_name] 
		async "nguyen_dinh"(ctx) {
			// this.logger.in1fo("Something happened", ctx.params);
			let listCategoryWithPopulateProducts = await ctx.call('examples.list', { populate: ['products'] });
			console.log({ listCategoryWithPopulateProducts: listCategoryWithPopulateProducts.rows.map(item => item.products) })
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
