"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  File đính kèm hồ sơ
 */
module.exports  = DATABASE_MIDDLEWARE("document_file", {
    //_________Văn bản
    document: {
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    },
    //_________file core
    file: {
        type: Schema.Types.ObjectId,
        ref: "file"
    },
    //_________Author
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }, 
});
