"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

// https://chatgpt.com/c/67c42862-e6d8-800f-8ac0-740580104ac4
// hiepnh.pmi@gmail.com

module.exports  = DATABASE_MIDDLEWARE("crm_search_keyword", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //________Nội dung
    keyword: String,
    //_________Số lượt tìm kiếm
    searchCount: { type: Number, default: 0 },
    //_________Lần tìm kiếm cuối cùng
    lastSearched: { type: Date, default: Date.now },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})