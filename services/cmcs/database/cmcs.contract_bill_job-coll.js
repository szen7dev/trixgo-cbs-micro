"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_bill_job", {
    //_________Nội dung
    content: String,

    //_________Người comment
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    
})