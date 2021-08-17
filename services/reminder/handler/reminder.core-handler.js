const Agenda            = require('agenda');
const { MongoClient }   = require('mongodb');
let agenda;

(async function run() {
    let client = await MongoClient.connect("mongodb://localhost:27017");
    agenda = new Agenda().mongo(client.db("agendatest"), "jobs");
  
	await new Promise(resolve => agenda.once('ready', resolve));
})(); //IIFE func - run now
  
module.exports = {
    addJob: {
        params: {
            // page            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                let timeScheduler = new Date(Date.now() + 10000);
                for(let i = 0; i<10; i++) {
                    agenda.schedule(timeScheduler, 'reminder_birthday');
                    console.log(`agenda: ${i} added`)
                }
                return { 
                    error: false, ctx
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

	addJobMuteConversation: {
        params: {
            conversationID	: { type: "string" },
            userID			: { type: "string" },
            timeMute		: { type: "string" },
        },
        async handler(ctx) {
            try {
				// await this.validateEntity(ctx.params);
                let { conversationID, userID, timeMute } = ctx.params;
                let timeScheduler = new Date(Date.now() + 5000);

				// const { setTimeZone } 	= require('../../../tools/utils/time_utils')
				// const moment = require('moment');
				// let date = moment("2021-08-16T16:30:24Z").format();
				// console.log(setTimeZone("2021-08-16T16:30:24Z").format());
				// let timeScheduler2 = new Date(timeMute).toUTCString();

				switch (+timeMute) {
					case 1:
						timeScheduler = "one hours";
						break;
					case 4:
						timeScheduler = "four hours";
						break;
					case 8:
						timeScheduler = "tomorrow at 8am";
						break;
					default:
						break;
				}

				// 3:30pm
				agenda.schedule(timeScheduler, 'update_mute_conversation', { conversationID, userID, isMute: "false" });
				console.log(`agenda: update_mute_conversation added - ${timeScheduler}`);

                return { error: false, data: { conversationID, userID, timeMute, timeScheduler }, status: 200 }
            } catch (error) {
                return { error: true, message: error.message, status: 500 };
            }
        }
    },

	removeJobMuteConversation: {
        params: { },
        async handler(ctx) {
            try {
                const removeJobMuteConversation = await agenda.cancel({ name: "update_mute_conversation" });
				console.log({ __REMOVE_JOB: removeJobMuteConversation })

                return { error: false, data: removeJobMuteConversation };
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}