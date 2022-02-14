"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * ÁP DỤNG CHO TRƯỜNG HỢP, LẤY CHI TIẾT FILE CỦA MEDIA
 */
module.exports  = DATABASE_MIDDLEWARE("media_file", {
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },
    
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file'
    },

    //_________Số lượng reaction của file
    amountReaction: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng comment của file
    amountComment: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng lượt xem của file
    amountView: {
        type    :  Number,
        default : 0
    },
})