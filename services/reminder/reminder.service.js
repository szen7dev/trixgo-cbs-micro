"use strict";
const Agenda            				= require('agenda');
const { MongoClient }   				= require('mongodb');

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_REMINDER } 	        = require('./helper/reminder.actions-constant');
const REMINDER__CORE_HANLDER            = require('./handler/reminder.core-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.REMINDER,
	mixins: [
		DbService('reminder_cores'),  
		DbService('reminder_tasks'),  
		CacheCleaner([CF_DOMAIN_SERVICES.REMINDER])
    ],

	/**
	* Service metadata
	*/
	metadata: {

	},

	/**
	* Service dependencies
	*/
	dependencies: [
		CF_DOMAIN_SERVICES.AUTH
	],
	/**
	* Actions
	*/
	actions: {	
		[CF_ACTIONS_REMINDER.ADD_JOB] 		: REMINDER__CORE_HANLDER.addJob,
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
		const runDefineTask = async () => {
			/**
			 * define all EVENT for COMSUMER
			 */
			// --------- demo event: reminder_birthday --------- //
			agenda.define('reminder_birthday', () => {
				console.log(`defined birthday`);
			});


			await new Promise(resolve => agenda.once('ready', resolve));
			agenda.start();
		}

		let client = await MongoClient.connect("mongodb://localhost:27017");
		let agenda = new Agenda().mongo(client.db("agendatest"), "jobs");
	
		runDefineTask().catch(error => {
			console.error({ runDefineTask_error: error });
			process.exit(-1);
		});
	},

	/**
	* Service stopped lifecycle event handler
	*/
	async stopped() {
		
	}
};
