"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("comment_file_core", {
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment_core'
    }, 
    
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    },
})