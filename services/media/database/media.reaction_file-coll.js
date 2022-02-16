"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_reaction_file", {
    /**
     * Bài viết 
     */
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },

    /**
     * File, Image
     */
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_file'
    },

    /**
     * Cảm xúc
     */
    reaction: {
        type    : Schema.Types.ObjectId,
        ref     : 'reaction_core'
    },

    /**
     *  Người tạo
     */
    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})