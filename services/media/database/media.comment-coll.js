"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_comment", {
    /**
     * Bài viết 
     */
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },

    /**
     * Comment
     */
    comment: {
        type    : Schema.Types.ObjectId,
        ref     : 'comment_core'
    },

    /**
     * Comment cha
     */
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment_core'
    },

    /**
     *  Người comment
     */
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})