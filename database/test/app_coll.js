"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let productSchema = new Schema({
  /**
     * Tên app
     */
    name: String,
    /**
     * Ký hiệu app không được bỏ trống, không được trùng
     */
    slug: { 
        type   : String,
        require: true,
        unique : true,
    },
    /**
     * Lĩnh vực hoạt động của ứng dụng
     */
    members: [{
        type:  Schema.Types.ObjectId,
        ref : 'account'
    }],
    field: {
        type   : Number,
        default: 0
    },
    description: String,
    // image: {
    //     type: String,
    //     defautl: 'app_default.png'
    // },
  
    /**
     * Người tạo
     */
    userCreate: {
        type:  Schema.Types.ObjectId,
        ref : 'account'
    },
    /**
     * Người cập nhật
     */
    userUpdate: {
        type:  Schema.Types.ObjectId,
        ref : 'account'
    }
}, {
	timestamps: true
});

let PRODUCT_COLL  = mongoose.model('app', productSchema);

module.exports = PRODUCT_COLL;