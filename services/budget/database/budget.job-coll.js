"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * Nhóm khoản mục phí ngân sách
 */
module.exports  = DATABASE_MIDDLEWARE("budget_group", {
    //_________ Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Hợp đồng (COSTCONTROL)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "budget_group"
    },
    // childs: [{
    //     type: Schema.Types.ObjectId,
    //     ref: "budget_group"
    // }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    //_________Ký hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    /**
     * Link với Hạng mục (công việc level = 1) bên Phân tích chi phí
     * Mục đích để cập nhật KL cho ngân sách trong trường hợp có thay đổi KL công việc bên Phân tích chi phí
     */
    // linkItem: {
    //     type: Schema.Types.ObjectId,
    //     ref : "job"
    // },
    //_________Công việc (Công việc link với đã thực hiện journals[])
    // jobs: [{
    //     type: Schema.Types.ObjectId,
    //     ref: "budget_job"
    // }],
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
}, {
    isRecursive: true,
    paths: ['childs', 'linkItem', 'jobs', 'journals']
});