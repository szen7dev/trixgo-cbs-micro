"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  Hợp đồng kinh tế
 */
module.exports  = DATABASE_MIDDLEWARE("warehouse", {
   /**
     * Thuộc về công ty nào
     */    
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    /**
     * Tên
     */
    name: String,
    /**
     * Mô tả
     */
    description: String,
    /**
     * Cha (sử dụng để hiển thị theo quy tắc đệ quy)
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "warehouse"
    },
    /**
     * Con
     */
    childs: [
        {
            type: Schema.Types.ObjectId,
            ref: "warehouse"
        }
    ],
    /**
     * để tính được maxLevel(level cấp cao nhất)
     * VD: maxLevel = 3 => for 3 lần
     */
    level: {
        type: Number,
        default: 1 
    },
    /**
     * Người tạo
     */
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
     /**
     * Người cập nhật
     */
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
})