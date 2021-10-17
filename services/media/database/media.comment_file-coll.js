"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_comment_file", {
    /**
     * Comment
     */
    comment: {
        type    : Schema.Types.ObjectId,
        ref     : 'media_comment'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    },
})