"use strict";

require('dotenv').config();

let	ApiGateway 				= require("moleculer-web"),
	express         		= require('express'),
	app               		= express(),
	server            		= require('http').Server(app),
	{ CF_DOMAIN_SERVICES } 	= require('./helper/domain.constant'),
	apiV1 					= require("./gateway.alias"); // config api
 	// SocketService 			= require('./socket-io.service');			

const { CF_ACTIONS_GATEWAY } 	        = require('./helper/gateway.actions-constant');
const GATEWAY__HANDLER      			= require('./handler/gateway.handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.GATEWAY,
	mixins: [
		ApiGateway, 
		// SocketService,
		// OpenApiMixin(),
	],
	settings: {
		// Exposed port
		port: process.env.PORT || 3003,
		// Exposed IP
		ip: "0.0.0.0",

		/**
		 * MIDDLEWARE GLOBAL
		 */
		// Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
		use: [
		],

		cors: {
            origin: "*",
			methods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept, X-Access-Token"],
            exposedHeaders: [],
            credentials: false,
            maxAge: 3600
        },
		routes: [
			// get routes from external file - merged with subproject if applicable
			// sppf.subprojectMergeRoutes(apiV1, path.resolve(resourcesDirectory+"/routes/apiV1") ),
			apiV1, // routing
		],

		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: false,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: null,
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,

		// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
		assets: {
			folder: "public",
			// Options to `server-static` module
			options: {}
		}
	},

	/**
	* Actions HEALTH/VERSION
	*/
	actions: {	
		[CF_ACTIONS_GATEWAY.CHECK_HEALTH] 		: GATEWAY__HANDLER.checkHealth,
		[CF_ACTIONS_GATEWAY.CHECK_VERSION] 		: GATEWAY__HANDLER.checkVersion,
	},

	methods: {
		initRoutes(app) {
			app.get('/', function(req,res) {
				res.redirect('/ui');
			});
		},

		async authenticate(ctx, route, req, res) {
			try {
				let accessToken = req.headers[ 'x-access-token' ] || req.headers.token || null;
				if(accessToken){

					let resolveToken = null;
					// let resolveToken = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.RESOLVE_TOKEN}`, { token: accessToken })
					if(resolveToken.error){
						return Promise.reject(resolveToken.message);
					}	
					return Promise.resolve(null)
				}
				else{
					return Promise.reject('redirect_url_clear_session');
				}
			} catch (error) {
				return Promise.reject(error);
			}
        },

		async authorize(ctx, route, req, res) {
			let checkAuthorization = null;
			// let checkAuthorization = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.CHECK_AUTHORIZATION}`, {originalUrl: req.originalUrl})
			if(checkAuthorization.error){
				return Promise.reject(checkAuthorization.message);
			}
			return Promise.resolve(null)
		},
	},

	// some lifecycle
	created() {
		// config socket IO
		// this.initSocketIO(server);
		// const listUserConnected = [];
		// this.listUserConnected = listUserConnected;
	},
	started() {
		// port socket IO
		// server.listen(4000);
	},
	stopped() {
		if (this.app.listening) {
			this.app.close(err => {
				if (err)
					return this.logger.error("WWW server close error!", err);

				this.logger.info("WWW server stopped!");
			});
		}
	}
};
