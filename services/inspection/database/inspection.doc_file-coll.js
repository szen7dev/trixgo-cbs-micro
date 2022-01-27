"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_doc_file", {
    inspection: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_doc'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file'
    },
})