"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE(" ", {
    //_________ Phân loại chính(Read me, Vocation, E-Tranining & reaction ...) 
    type: Number,
    //_________Tên chủ đề, tên bài viết
    name: String,
    //_________mô tả chủ đề, mô tả bài viết
    description: String,

    //_________logo cho chủ đề
    logo: {
        type    : Schema.Types.ObjectId,
        ref     : 'training_subject'
    },
    //_________Số lượng bài viết
    amountLessions: {
        type: Number,
        default: 0
    },

    //_________Số lượt xem(Tổng của các bài viết) hoặc tổng của 1 bài viết
    amountViews: {
        type: Number,
        default: 0
    },

    //_________Số lượng comment của 1 bài viết
    amountComments: {
        type: Number,
        default: 0
    },
    
    //_________Số sao đánh giá trung bình
    amountStars: {
        type: Number,
        default: 0
    },

    //___________________________________________________Các trường thuộc bài viết
    //_________Nội dung
    content: String,
    //_________Nếu là bài học thì parent là trường chủ đề 
    parent: {
        type    : Schema.Types.ObjectId,
        ref     : 'training_subject'
    },

    userCreate: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },
    userUpdate: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    }
})   