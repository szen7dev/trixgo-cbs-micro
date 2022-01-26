"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_doc_comment_file", {
    inspection: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_doc'
    },
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_doc_comment'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file'
    }
})