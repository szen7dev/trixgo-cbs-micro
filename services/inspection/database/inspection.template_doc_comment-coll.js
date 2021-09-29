"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_doc_comment", {
    template: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment_core'
    },
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment_core'
    }
}) 