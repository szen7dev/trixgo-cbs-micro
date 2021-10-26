"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  File đính kèm hồ sơ
 */
module.exports  = DATABASE_MIDDLEWARE("document_file", {
    document: {
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    },
    file: {
        type: Schema.Types.ObjectId,
        ref: "file_core"
    }
});
