"use strict";

const _ 							= require("lodash");
let session 						= require('express-session');
let redis 							= require('redis');
const jwt                           = require('jsonwebtoken');
const ACCOUNT_COLL 					= require("../database/test/account_coll");
const CacheCleaner 					= require("../mixins/cache.cleaner.mixin");
let { CF_SERVICES } 				= require('../config/constants/services');
let { CF_ACTIONS_ACCOUNT } 			= require('../config/constants/actions');
let { CF_EVENT_ACCOUNT } 			= require('../config/constants/events');
let DbService 						= require("../mixins/db.mixin");
let ACCOUNT_ACTION 					= require('../api/account');
let ACCOUNT_EVENT					= require('../events/account');

// let store;
// if (process.env.API_SESSION_REDIS) {
// 	const RedisStore 				= require('connect-redis')(session);
// 	const redisClient 				= redis.createClient();
// 	store							= new RedisStore({client: redisClient});
// } else {
// 	store 							= new MemoryStore();
// }

module.exports = {
	name: CF_SERVICES.ACCOUNT ,
	mixins: [
		DbService(ACCOUNT_COLL), 
		CacheCleaner([CF_SERVICES.ACCOUNT])
	],

	settings: {
		fields: ["_id", "firstName", "lastName", "email", "pasword"],
		use: [
			session({
				// store: store,
				secret: process.env.COOKIE_SECRET,
				resave: false,
				saveUninitialized: false,
			})
		]
	},

	actions: {
	
		[CF_ACTIONS_ACCOUNT.GET_LIST]		: ACCOUNT_ACTION.getList,

		[CF_ACTIONS_ACCOUNT.REGISTER]		: ACCOUNT_ACTION.register,

		[CF_ACTIONS_ACCOUNT.LOGIN]			: ACCOUNT_ACTION.login,

		[CF_ACTIONS_ACCOUNT.FIND_BY_ID]		: ACCOUNT_ACTION.findById,

		[CF_ACTIONS_ACCOUNT.LOGOUT]			: ACCOUNT_ACTION.logout,

		[CF_ACTIONS_ACCOUNT.UPDATE_INFO]	: ACCOUNT_ACTION.updateInfo,

		// APP
		[CF_ACTIONS_ACCOUNT.CREARE_APP]		: ACCOUNT_ACTION.createApp,
		[CF_ACTIONS_ACCOUNT.UPDATE_APP]		: ACCOUNT_ACTION.updateApp,
		[CF_ACTIONS_ACCOUNT.INSER_MEMBER_IN_APP]: ACCOUNT_ACTION.insertMemberIntoApp,

		
		/**
			 * Get user by JWT token (for API GW authentication)
			 *
			 * @actions
			 * @param {String} token - JWT token
			 *
			 * @returns {Object} Resolved user
		*/
		
		// resolveToken: {
		// 	// cache: {
		// 	// 	keys: ["token"],
		// 	// 	ttl: 60 * 60 // 1 hour
		// 	// },
		// 	params: {
		// 		token: "string"
		// 	},
		// 	handler(ctx) {
		// 		return new this.Promise((resolve, reject) => {
		// 				jwt.verify(ctx.params.token, process.env.SECRET_KEY_JWT , (err, decoded) => {
		// 					if (err) {
		// 						return reject(err);
		// 					}
		// 					resolve(decoded);
		// 				});
		// 			})
		// 			.then(decoded => {
		// 				if (decoded.infoUser._id) {
		// 					return this.adapter.findById(decoded.infoUser._id)
		// 						.then(found => {
		// 								return found;
		// 						});
		// 				}
		// 			});
		// 	}
		// },		
	},

	events: {
		[CF_EVENT_ACCOUNT.DEMO]: ACCOUNT_EVENT.demo,
	},
	method: {
	},

	onBeforeCall(ctx, route, req, res) {
		// console.log(req);
		// ctx.meta.http = {
		//   method: req.method,
		//   path: req.$alias.path,
		//   url: req.url,
		// };
		// //console.log(ctx.meta.http);
		// ctx.meta.headers = req.headers;
	  },
};
