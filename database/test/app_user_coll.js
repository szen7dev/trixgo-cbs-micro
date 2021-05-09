"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
     /**
     * Tài khoản
     */
    account: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    /**
     * Ứng dụng được quyền truy cập
     */
    app: {
        type : Schema.Types.ObjectId,
        ref  : 'app'
    },
   
    /**
     * Dùng để phân biệt Admin ứng dụng/thành viên thông thường
     * 0: Admin
     * 1: Thành viên thường
     */
    level: {
        type    : Number,
        default : 1
    },
    /**
     * Số lần truy cập ứng dụng
     */
    numLog:{
        type   : Number,
        default: 0
    },
    /**
     * Người tạo
     */
    userCreate: {
        type : Schema.Types.ObjectId,
        ref  : 'account'
    },
    /**
     * Người cập nhật
     */
    userUpdate: {
        type : Schema.Types.ObjectId,
        ref  : 'account'
    }
}, {
	timestamps: true
});

let APP_USER_COLL  = mongoose.model('app_user', userSchema);

module.exports = APP_USER_COLL;