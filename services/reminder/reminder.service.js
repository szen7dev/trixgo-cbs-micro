"use strict";

const Agenda            				= require('agenda');
const { MongoClient }   				= require('mongodb');

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_REMINDER } 	        = require('./helper/reminder.actions-constant');
const { CF_ACTIONS_CHATTING } 	        = require('../chatting/helper/chatting.actions-constant');


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
		[CF_ACTIONS_REMINDER.ADD_JOB] 							: REMINDER__CORE_HANLDER.addJob,
		[CF_ACTIONS_REMINDER.ADD_JOB_MUTE_CONVERSATION] 		: REMINDER__CORE_HANLDER.addJobMuteConversation,
		[CF_ACTIONS_REMINDER.REMOVE_JOB_MUTE_CONVERSATION] 		: REMINDER__CORE_HANLDER.removeJobMuteConversation,
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

			agenda.define('update_mute_conversation', async (job, done) => {
				console.log(`========================================`);
				console.log(`done update mute conversation!!!!`);
				console.log({ __JOB: job.attrs });

				await this.broker.call(`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.UPDATE_MUTE_CONVERSATION}`, job.attrs.data, {
					meta: {
						infoUser: { _id: job.attrs.data.userID, jobID: job.attrs._id }
					}
				});

				done();
			});

			agenda.on("success:update_mute_conversation", (job) => {
				console.log({ __SUCCESS_UPDATE_MUTE_CONVERSATION: job.attrs });;
			});

			agenda.on("fail:update_mute_conversation", (err, job) => {
				console.log({ __FAILED_UPDATE_MUTE_CONVERSATION: err.message });
			});

			agenda.on("complete", (job) => {
				console.log({ __COMPLETED_JOB: job.attrs.name });
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
