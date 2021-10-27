"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_comment_image", {
    /**
     * Hình ảnh 
     */
    image: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
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