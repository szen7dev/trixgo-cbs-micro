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
     * file
     */
    file: {
        type    : Schema.Types.ObjectId,
        ref     : 'file_core'  
    },

    /**
     * Cảm xúc
     */
    reaction: {
        type    : Schema.Types.ObjectId,
        ref     : 'reaction_core'
    },

    /**
     *  Người tạo(Lấy nhanh)
     */
    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})