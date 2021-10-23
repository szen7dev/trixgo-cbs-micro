"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_reaction_image", {

    /**
     * Hình ảnh 
     */
    image: {
        type    :  Schema.Types.ObjectId,
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
     *  Người reaction
     */
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})