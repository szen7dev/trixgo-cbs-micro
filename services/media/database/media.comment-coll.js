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
    // comment: {
    //     type    : Schema.Types.ObjectId,
    //     ref     : 'comment'
    // },
    
    //_________ID reply của comment reply cuối (Chi lưu cho comment cha)
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment'
    },

    //_________Người tạo comment
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },

    //_________Số lượng comment con của comment cha
    amountCommentReply: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng reaction con của comment cha
    amountReaction: {
        type    :  Number,
        default : 0
    },

    //_________1 mảng loại cảm xúc để show trên view
    typeReactions: [{
        type :  Number,
    }],

    //_________Người được tag vào comment
    tag: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],

    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})