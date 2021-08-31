"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_doc_file", {
    template: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    },
})