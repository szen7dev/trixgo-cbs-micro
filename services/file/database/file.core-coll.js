"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
const { 
    FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS
}                           = require('../helper/file.keys-constant');

module.exports  = DATABASE_MIDDLEWARE("file_core", {
    // list app CONSTANT
    app     : { type: String, require: true },
    nameOrg : { type: String, require: true }, //Tên gốc
    name    : { type: String, require: true }, //uuidv1
    status: { 
        type: Number, 
        enum:[FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS],
        require: true, 
        default: FILE_PROCESSING
    },
    url : { type: String, require: true },
    size: { type: Number },
    type: { type: String },

    userCreate: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        require: true
    }
});