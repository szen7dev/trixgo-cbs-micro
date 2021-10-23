"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_reaction", {

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
        ref     : 'comment'
    },

    /**
     * Cảm xúc
     */
    reaction: {
        type    : Schema.Types.ObjectId,
        ref     : 'reaction_core'
    },

    /**
     *  Người reaction
     */
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})