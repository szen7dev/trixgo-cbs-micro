"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_doc_comment", {
    //_________templateID
    template: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    //_________ID comment core
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment'
    },
    //_________ID comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'inspection_template_doc_comment'
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