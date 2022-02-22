"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_doc_comment", {
    // inspect doc
    inspection: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc'
    },

    // inspect doc
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment'
    },

    // Comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_doc_comment'
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
})