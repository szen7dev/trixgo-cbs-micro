"use strict";

/**
 * KHU VỰC-NHÓM CÔNG VIỆC
 * - Mỗi khu vực-Tính chất công việc => chỉ tồn tại duy nhất 1 mẩu tin
 */

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_area_group", {
    //_________Thuộc dự án
    project: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },
    area: {
        type: Schema.Types.ObjectId,
        ref: "inspection_area"
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: "inspection_group"
    },
    //_________% hoàn thành (max = 100)
    percentage: { type: Number, default: 0, max: 100 },
    //_________Ghi cú 
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