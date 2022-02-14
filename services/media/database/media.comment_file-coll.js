"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_comment_file", {
    //_________ID bài viết
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },

    //_________ID file
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_file'
    },

    //_________ID Comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment_file'
    },

    //_________Comment core
    comment: {
        type    : Schema.Types.ObjectId,
        ref     : 'comment_core'
    },

    //_________ID reply của comment reply cuối (Chi lưu cho comment cha)
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment_file'
    },

    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})