"use strict";

require('dotenv').config();

let	ApiGateway 				= require("moleculer-web"),
	express         		= require('express'),
	path            		= require('path'),
	cookieParser    		= require('cookie-parser'),
	cors 					= require('cors'),
	bodyParser     			= require('body-parser'),
	expressFavicon 			= require('serve-favicon'),
	expressStatic 			= require('serve-static'),
	app               		= express(),
	server            		= require('http').Server(app),
	{ CF_SERVICES } 		= require('../config/constants/services'),
	{ 
		CF_ACTIONS,
		CF_ACTIONS_AUTH,
	} 						= require('../config/constants/actions'),
	// cf_swOption				= require('../config/cf_swOption'),
	apiV1 					= require("../routing/routes/apiV1"), // config api
	apiV1_Authoriz 			= require("../routing/routes/apiV1_Authoriz"), 
	apiV1_Authen 			= require("../routing/routes/apiV1_Authen"), 
	apiV1_Member 			= require("../routing/routes/apiV1_Member");
 	// SocketService 			= require('./socket-io.service');			

module.exports = {
	name: CF_SERVICES.API,
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

		// Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
		use: [
			// cf_swOption.swMiddleware
		],

		cors: {
            // Configures the Access-Control-Allow-Origin CORS header.
            origin: "*",
            // Configures the Access-Control-Allow-Methods CORS header. 
			methods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            // Configures the Access-Control-Allow-Headers CORS header.
            allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept, X-Access-Token"],
            // Configures the Access-Control-Expose-Headers CORS header.
            exposedHeaders: [],
            // Configures the Access-Control-Allow-Credentials CORS header.
            credentials: false,
            // Configures the Access-Control-Max-Age CORS header.
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

					let resolveToken = await ctx.call(`${CF_ACTIONS.AUTH}.${CF_ACTIONS_AUTH.RESOLVE_TOKEN}`, { token: accessToken })
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
			let checkAuthorization = await ctx.call(`${CF_ACTIONS.AUTH}.${CF_ACTIONS_AUTH.CHECK_AUTHORIZATION}`, {originalUrl: req.originalUrl})
			if(checkAuthorization.error){
				return Promise.reject(checkAuthorization.message);
			}
			return Promise.resolve(null)
		},
	},

	// some lifecycle
	created() {
		// const app = express();
		// app.use(express.json());
		// app.use(express.urlencoded({ extended: false }));
		// app.use(cors());
		// app.use(cookieParser());
		// // app.use(cf_swOption.swMiddleware);
		// app.use(expressFavicon(path.join(__dirname, '../ui/favicon.png')));
		// app.use('/ui',expressStatic(path.join(__dirname, '../ui')));
		// app.use('/ui/dist',expressStatic(path.join(__dirname, '../dist')));
		// app.use('/node_modules',expressStatic(path.join(__dirname, '../node_modules')));
		// app.use('/node_modules',expressStatic(path.join(__dirname, '../node_modules')));
		// app.use(bodyParser.json())
		// app.use(bodyParser.urlencoded({ extended: true }))
		// app.set("etag", true);
		// app.get('/apidoc.json', function(req,res){
		// 	res.setHeader('Content-Type', 'application/json');
		// 	res.send(swaggerSpec);
		// });
		// // catch 404 and forward to error handler
		// // app.use(function(req, res, next) {
		// // 	next(createError(404));
		// // });


		// this.initRoutes(app);
		// this.app = app;

		// // config socket IO
		// // this.initSocketIO(server);
		// const listUserConnected = [];
		// this.listUserConnected = listUserConnected;
	},
	started() {
		// port socket IO
		// server.listen(4000);

		// port swagger stats
		// this.app.listen(Number(5000), err => {
		// 	if (err)
		// 		return this.broker.fatal(err);

		// 	this.logger.info(`Swagger stats started on port ${5000}`);
		// });

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
