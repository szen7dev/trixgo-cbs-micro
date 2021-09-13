const Agenda            = require('agenda');
const ObjectID 			= require('mongodb').ObjectID;
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
                let timeScheduler = new Date(Date.now() + 10000);

				// const { setTimeZone } 	= require('../../../tools/utils/time_utils')
				// const moment = require('moment');
				// let date = moment("2021-08-16T16:30:24Z").format();
				// console.log(setTimeZone("2021-08-16T16:30:24Z").format());
				// let timeScheduler2 = new Date(timeMute).toUTCString();

				// switch (+timeMute) {
				// 	case 1:
				// 		timeScheduler = "one hours";
				// 		break;
				// 	case 4:
				// 		timeScheduler = "four hours";
				// 		break;
				// 	case 8:
				// 		timeScheduler = "tomorrow at 8am";
				// 		break;
				// 	default:
				// 		timeScheduler = `${timeMute} hours`;
				// 		break;
				// }

				// 3:30pm
				agenda.schedule(timeScheduler, 'update_mute_conversation', { conversationID, userID, isMute: "false" });
				console.log(`agenda: update_mute_conversation added - ${timeScheduler}`);

                return { error: false, data: { conversationID, userID, timeMute, timeScheduler }, status: 200 }
            } catch (error) {
                return { error: true, message: error.message, status: 500 };
            }
        }
    },

	deleteJobMuteConversation: {
        params: {
			jobID: { type: "string", optional: true },
		},
        async handler(ctx) {
            try {
				let { jobID } = ctx.params;
				// name: "update_mute_conversation"

				if(jobID){
					// const infoJobMute = await agenda.jobs({ _id: ObjectID(jobID) });
					// console.log({ infoJobMute, jobID })
					agenda.jobs(
						{ _id: ObjectID(jobID) },
						(err, num) => console.log(err, num) // output: null 1
					);
				}

				console.log({ jobID })

                // const removeJobMuteConversation = await agenda.cancel({ name: "update_mute_conversation" });
				// console.log({ __REMOVE_JOB: removeJobMuteConversation })

                return { error: false, data: jobID };
            } catch (error) {
				console.error(error);
                return { error: true, message: error.message };
            }
        }
    },

	addJobReminderConversation: {
        params: {
            conversationID	: { type: "string" },
            userID			: { type: "string" },
            remindTime		: { type: "string" },
            repeat			: { type: "string" },
            notifyFor		: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { conversationID, userID, remindTime, repeat, notifyFor } = ctx.params;
				let humanTime = '';

				// ["once", "daily", "weekly", "monthly", "yearly"]
				switch (repeat) {
					case 'daily':
						humanTime = '1 day';
						break;
					case 'weekly':
						humanTime = '1 week';
						break;
					case 'monthly':
						humanTime = '1 month';
						break;
					case 'yearly':
						humanTime = '1 year';
						break;
					default:
						break;
				}

				if(humanTime){
					const reminder = agenda.create('add_reminder_conversation', {
						conversationID, userID, remindTime, repeat, notifyFor 
					});
					await agenda.start();
					await reminder.repeatEvery(humanTime, {
						skipImmediate: true
					}).save();
				}

				if(remindTime && repeat === 'once'){
					let timeScheduler = new Date(remindTime).getTime();

					agenda.schedule(timeScheduler, 'add_reminder_conversation', {
						conversationID, userID, remindTime, repeat, notifyFor 
					});
					console.log(`agenda: add_reminder_conversation added - ${new Date(remindTime)} - ${repeat}`);
				}

                return { error: false, message: 'success', status: 200 }
            } catch (error) {
                return { error: true, message: error.message, status: 500 };
            }
        }
    },

	deleteJobReminderConversation: {
        params: {
			jobID: { type: "string", optional: true },
		},
        async handler(ctx) {
            try {
				let { jobID } = ctx.params;
				// name: "update_mute_conversation"

				// if(jobID){
				// 	// const infoJobMute = await agenda.jobs({ _id: ObjectID(jobID) });
				// 	// console.log({ infoJobMute, jobID })
				// 	agenda.jobs(
				// 		{ _id: ObjectID(jobID) },
				// 		(err, num) => console.log(err, num) // output: null 1
				// 	);
				// }

				// console.log({ jobID })

                const removeJobReminderConversation = await agenda.cancel({ name: "add_reminder_conversation" });
				console.log({ __REMOVE_JOB: removeJobReminderConversation })

                return { error: false, data: jobID };
            } catch (error) {
				console.error(error);
                return { error: true, message: error.message };
            }
        }
    },

}