"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_doc_reaction", {
    template: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    reaction: {
        type    :  Schema.Types.ObjectId,
        ref     : 'reaction_core'
    },
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    }
})