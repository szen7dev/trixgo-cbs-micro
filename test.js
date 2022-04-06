console.log('Deployed!!!... :))')

const mongoose = require('mongoose');

async function run(){
    const conn = mongoose.createConnection('mongodb://localhost/cbs_staging', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
    });

    conn
        .then(result => console.log({ result }))
        .catch(error => console.error(error))

    // let client = await MongoClient.connect(MONGODB_URL);
}

run()