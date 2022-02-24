"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
const { 
    FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS
}                           = require('../helper/file.keys-constant');

module.exports  = DATABASE_MIDDLEWARE("file", {
    app: {
        type: Schema.Types.ObjectId,
        ref: 'app'
    },
    nameOrg     : { type: String, require: true }, // Tên gốc
    name        : { type: String, require: true }, // uuidv1
    description : { type: String },
    //_____Trạng thái upload file 
    status: { 
        type: Number, 
        enum:[FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS],
        require: true, 
        default: FILE_PROCESSING
    },
    //_____Đường dẫn đến file s3 (root/test/image.png)
    path: { type: String, require: true },
    size: { type: Number },
    //_____image/jpeg
    mimeType: { type: String },
    /**
     * 1. Hình ảnh
     * 2. File
     * 3. Audio
     * 4. Video
     */
    type: { type: Number },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
});