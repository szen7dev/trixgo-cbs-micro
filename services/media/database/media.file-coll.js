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
    //_________Số lượng reaction của media
    amountReaction: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng comment của media
    amountComment: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng lượt xem của media
    amountView: {
        type    :  Number,
        default : 0
    },

    //_________1 mảng loại cảm xúc để show trên view(3 cái)
    typeReactions: [{
        type :  Number,
    }],
})