"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_doc_comment_file", {
    template: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc_comment'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    }
})