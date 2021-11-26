"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

//USER CÓ QUYỀN TRUY CẬP SUBJECT
module.exports  = DATABASE_MIDDLEWARE("user_pcm_plan_report", {
   
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    
    subject: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_report'
    },

    parent: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_report'
    },

    /**
     * 1: Người tạo
     * 2: Người xem
     * 3: Người chỉnh sửa
     */
    role: {
        type: Number,
        default: 2,
    },
    
    /**
     * THÔNG TIN NGƯỜI TẠO
     */
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
   
});