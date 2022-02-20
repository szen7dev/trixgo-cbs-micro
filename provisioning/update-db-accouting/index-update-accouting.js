const mongoose = require('mongoose');

async function run(){
    console.log({ listJ })
}
run()
const conn = mongoose.createConnection('mongodb://localhost/my_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});
