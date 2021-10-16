"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_doc_reaction", {
    inspection: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_doc'
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