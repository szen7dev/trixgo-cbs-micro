const Agenda            = require('agenda');
const { MongoClient }   = require('mongodb');
let agenda;

(async function run() {
    let client = await MongoClient.connect("mongodb://localhost:27017");
    agenda = new Agenda().mongo(client.db("agendatest"), "jobs");
  
    // Wait for agenda to connect. Should never fail since connection failures
    // should happen in the `await MongoClient.connect()` call.
    await new Promise(resolve => agenda.once('ready', resolve));
})()
  
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
}