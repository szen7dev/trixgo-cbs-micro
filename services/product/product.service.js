"use strict";

const Cron 							= require("moleculer-cron");
const DbService                		= require("../../tools/mixins/db.mixin");
const { CF_ACTIONS_PRODUCTS }   	= require('./constants/actions.constant.product');
const { CF_DOMAIN_SERVICES } 				= require('../gateway/constants/domain.constant');
const PRODUCTS_ACTION				= require('./product.handler');
const _                        		= require("lodash");
const CacheCleaner 					= require("../../tools/mixins/cache.cleaner.mixin");
module.exports = {
	name: CF_DOMAIN_SERVICES.PRODUCTS,
	// version: 1,
	/**
	* Mixins
	*/
	mixins: [
		// DbService(PRODUCT_COLL), 
		DbService('products'), 
		CacheCleaner([CF_DOMAIN_SERVICES.PRODUCTS]),
		Cron
	],

	crons: [{
		name: "CartsCleaner",
		cronTime: "0 1 * * *",
		onTick: function() {

			this.logger.info("Starting to Clean up the Carts");

			this.getLocalService("cart")
				.actions.cleanCarts()
				.then((data) => {
					this.logger.info("Carts Cleaned up", data);
				});
		}
	}],
	/**
	 	* Settings
	*/
	settings: {
		// Available fields in the responses
		fields: [
			"_id",
			"name",
			"price",
			"amout",
			"avatar",
			"category",
			"status",
		],

		populates: {
			category: {
				action: "categories.get",
				params: {
					fields: ["name"],
					// populates: ["category"]
				}
			},
		},

		entityValidator: {
			name:     "string",
			price:    {type: "number", min: 0},
			amout:    {type: "number", min: 0},
			// avatar:   "string",
			category: "string",
			// status:   "number",
		},
	},

	/**
	 	* Action Hooks
	*/
	hooks: {
		before: {
		}
	},

	/**
	 * Actions
	 */
	actions: {
		[CF_ACTIONS_PRODUCTS.CREATE]		: PRODUCTS_ACTION.create,
		[CF_ACTIONS_PRODUCTS.GET_LIST]		: PRODUCTS_ACTION.getList,
		[CF_ACTIONS_PRODUCTS.FIND_BY_ID]	: PRODUCTS_ACTION.findById,
		[CF_ACTIONS_PRODUCTS.REMOVE]		: PRODUCTS_ACTION.remove,
		[CF_ACTIONS_PRODUCTS.REMOVE_FROM_CATE] : PRODUCTS_ACTION.removeFromCate,
	},
	methods: {

		testCronJob() {
			return new Promise(async resolve => {
				try {
					console.log('DO SOME THING WITH METHOD CRON JOB PRODUCTS');
				} catch (error) {
					return resolve({ error: true, message: error.message });
				}
			})
		}
	},

	/**
	 	* Fired after database connection establishing.
	*/
	async afterConnected() {
	}
};
