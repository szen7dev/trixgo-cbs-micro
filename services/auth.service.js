"use strict";

const _ 							= require("lodash");
const jwt                           = require('jsonwebtoken');
const CacheCleaner 					= require("../mixins/cache.cleaner.mixin");
let { CF_SERVICES } 				= require('../config/constants/services');
const cfJwt                         = require('../config/cf_jws');
const { getAppIDByURLRequest }      = require('../utils/utils');
const { 
	CF_ACTIONS,
	CF_ACTIONS_AUTH,
} 									= require('../config/constants/actions');
const APP_USER_MODEL                = require('../models/core/app-user').MODEL
module.exports = {
	name: CF_SERVICES.AUTH ,
	mixins: [
		CacheCleaner([CF_SERVICES.AUTH])
	],

	settings: {
	},

	actions: {

		/**
			 * Get user by JWT token (for API GW authentication)
			 *
			 * @actions
			 * @param {String} token - JWT token
			 *
			 * @returns {Object} Resolved user
		*/
		
		[CF_ACTIONS_AUTH.RESOLVE_TOKEN]: {
			params: {
				token: "string"
			},
			handler(ctx) {
				try {
					let { token} = ctx.params;
					let decode 
					jwt.verify(token, cfJwt.secret , (err, decoded) => {
						if (err) {
							return ({error: true, message: err});
						}
						decode = decoded
					});
					ctx.meta.infoUser = decode.infoUser
					ctx.meta.token = token;
					ctx.meta.userID = infoUser._id;
					return ({error: false, message: 'resolve_token_success', data: infoUser});
				} catch (error) {
					return(error);
				}
			}
		},	

		/**
			 * Check authorization 
			 *
			 * @actions
			 * @param {String} originalUrl 
			 *
			 * @returns {Object} 
		*/

		[CF_ACTIONS_AUTH.CHECK_AUTHORIZATION]: {
			async handler(ctx) {
				try {
					let {originalUrl} = ctx.params
					let {infoUser} = ctx.meta
					// get API ID
					ctx.meta.APP_ID = await getAppIDByURLRequest(originalUrl);
                    // User không có quyền
                    if(infoUser.role == 0){
						return ({error: true, message: 'account_is_not_authorized'});
                    }

					// role = 1 (Admin) có quyền vào tất cả các app
                    if(infoUser.role != 1){
                        let checkUserValidAccessAppTemp = await this.checkUserValidAccessApp(ctx);
                        if(checkUserValidAccessAppTemp.error){
                            return ({error: true, message: checkUserValidAccessAppTemp.message});
                        }
                    }
					return ({error: false, message: 'resolve_token_success'});
				} catch (error) {
					return(error);
				}
			}
		}

	},

	events: {
	},
	methods: {
		async checkUserValidAccessApp(ctx) {
			try {
				let {infoUser, APP_ID: appID} = ctx.meta
				if(!appID){
					return ({error: true, message: 'app_id_empty'})
				}
				/**
				 * CHECK USER VALID
				 */
				let signalUserValidAccessApp = await APP_USER_MODEL.checkExistRecord({ userID: infoUser._id, appID });
				return signalUserValidAccessApp;
			} catch (error) {
				console.log({error});
				return next(new Error(error));
			}
			
		}
	},
};
