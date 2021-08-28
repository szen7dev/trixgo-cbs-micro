"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("reaction_comment_file", {
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'reaction_comment'
    },
    
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    },
})