"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * DATAHUB KHU VỰC-LĨNH VỰC-NHÀ THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_project", {
    //_________Nhà thầu
    contractor: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "datahub_field"
    },  
    //_________Xếp hạng (1-5)
    ranking: { type: Number, default: 0 },
    //_________Ghi chú
    note: String,
    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})