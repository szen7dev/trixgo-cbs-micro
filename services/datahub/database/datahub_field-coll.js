"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * DATAHUB LĨNH VỰC
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_project", {
    //_________Cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "datahub_field"
    },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,   
    //_________Số lượng nhà thầu tham gia
    numberOfContractors: { type: Number, default: 0 },
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