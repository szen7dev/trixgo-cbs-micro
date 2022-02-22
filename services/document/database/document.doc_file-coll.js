"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  File đính kèm hồ sơ
 */
module.exports  = DATABASE_MIDDLEWARE("document_file", {
    nameOrg     : { type: String, require: true }, // Tên gốc
    name        : { type: String, require: true }, // uuidv1

    //_________Công ty
    company: {
        type:  Schema.Types.ObjectId,
        ref : 'company'
    },

    //________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'deparment'
    },

    //_________Văn bản
    document: {
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    },

    //________Bình luận
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'document_comment'
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
