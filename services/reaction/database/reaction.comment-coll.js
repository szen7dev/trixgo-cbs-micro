"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("reaction_comment", {
    //_________Nội dung
    content: String,
    //_________Comment cha (nếu có)
    parent: {
        type: Schema.Types.ObjectId,
        ref : "reaction_comment"
    },
  
    //_________Số lượng comment con
    amountChilds: {
        type: Number,
        default: 0
    },
    //_________Số lượng reaction
    amountReactions: {
        type: Number,
        default: 0
    },
    
    //_________Người comment
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    
})