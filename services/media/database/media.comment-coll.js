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
     * Các files được đính kèm trong bài viết
     */
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'file_core'
    }],

    /**
     * Các ảnh được đính kèm trong bài viết
     */
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'file_core'
    }],

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
     *  ID comment reply cuối
     */
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment'
    },

    /**
     *  Người comment
     */
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})