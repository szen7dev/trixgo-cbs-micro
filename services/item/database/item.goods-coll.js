"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  HÀNG HOÁ, SẢN PHẨM, TÀI SẢN, CÔNG CỤ DỤNG CỤ,...
 */
module.exports  = DATABASE_MIDDLEWARE("goods", {
    //________Thuộc về công ty nào
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "goods"
    },
    level: {
        type: Number,
        default: 1 
    },
    /**
     * HỆ THỐNG QUẢN LÝ
     */
    //_________Do hệ thống quy định hay không (giá trị 1 hoặc trường company = null)
    belongSystem: { type: Number, default: 0 },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Mã link với phân loại chi phí của hệ thống
    linkSystem: {
        type: Schema.Types.ObjectId,
        ref: "goods"
    },
    //_________Có phải là mẫu hay không
    template: { type: Number, default: 0 },
    //_________Phân loại
    type: { type: Number, default: 1 },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    //_________Mã hiệu
    sign: String,    
    //_________Đơn vị
    unit: String,   
    //_________Đơn giá
    unitprice: { type: Number, default: 0 },
    //_________Ghi chú
    note: String, 
    //_________Hình ảnh
    image: { type: String, default: 'goods_default.png' },
    //_________File đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref : "file"
    }],
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