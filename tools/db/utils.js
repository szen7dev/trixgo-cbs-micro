"use strict";

const databaseConfig    = require('./cf_database');
const DATABASE_MODE     = process.env.NODE_ENV == 'production' ? true : false;

let MONGODB_URL = '';
if (DATABASE_MODE) {
    MONGODB_URL = `${databaseConfig.production._mongod_user === '' ? 'mongodb://' + databaseConfig.production._mongodb_host + ':' + databaseConfig.production._mongodb_port + '/' + databaseConfig.production._mongod_name :
        'mongodb://' + databaseConfig.production._mongod_user + ':' + databaseConfig.production._mongodb_pass + '@' + databaseConfig.production._mongodb_host + ':' + databaseConfig.production._mongodb_port + '/' + databaseConfig.production._mongod_name}`;
 }
else {
    MONGODB_URL = `${databaseConfig.development._mongod_user === '' ? 'mongodb://' + databaseConfig.development._mongodb_host + ':' + databaseConfig.development._mongodb_port + '/' + databaseConfig.development._mongod_name :
            'mongodb://' + databaseConfig.development._mongod_user + ':' + databaseConfig.development._mongodb_pass + '@' + databaseConfig.development._mongodb_host + ':' + databaseConfig.development._mongodb_port + '/' + databaseConfig.development._mongod_name}`;
}
console.log({MONGODB_URL})

exports.MONGODB_URL = MONGODB_URL;
exports.DATABASE_MODE = DATABASE_MODE;