"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_comment", {
    //_________ID bài viết
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },

    //_________ID Comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment'
    },
    
    //_________Comment core
    comment: {
        type    : Schema.Types.ObjectId,
        ref     : 'comment'
    },
    
    //_________ID reply của comment reply cuối (Chi lưu cho comment cha)
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment'
    },

    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})