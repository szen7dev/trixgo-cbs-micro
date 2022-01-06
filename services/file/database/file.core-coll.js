"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
const { 
    FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS
}                           = require('../helper/file.keys-constant');

module.exports  = DATABASE_MIDDLEWARE("file_core", {
    //_____list app CONSTANT
    app     : { type: String, require: true },
    nameOrg : { type: String, require: true }, //Tên gốc
    name    : { type: String, require: true }, //uuidv1
    //_____Trạng thái upload file
    status: { 
        type: Number, 
        enum:[FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS],
        require: true, 
        default: FILE_PROCESSING
    },
    //_____Đường dẫn đến file s3
    url : { type: String, require: true },
    size: { type: Number },
    //_____image/jpeg
    type: { type: String },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    
});