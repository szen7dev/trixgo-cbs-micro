"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * DATAHUB KHU VỰC-LĨNH VỰC-NHÀ THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_contractor", {
    //_________Lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "datahub_field"
    },  
    //_________Tỉnh/Thành phố
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Nhà thầu thực hiện dịch vụ/lĩnh vực
    contractor: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Xếp hạng (1-5)
    ranking: { type: Number, default: 1 },
    //_________Ghi chú
    note: String,
    //_________Trạng thái hoạt động
    status: { type: Number, default: 1 },
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