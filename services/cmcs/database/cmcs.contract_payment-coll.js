"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_payment", {
    //_________Phân loại (1-Tạm ứng/2-Thanh toán/3-Quyết toán )(*) Lấy theo ipc
    type: { type: Number, default: 1 },

    /**
     * START THÔNG TIN LẤY TỪ HỢP ĐỒNG
     */
    //_________Phân loại vào ra (1-Hợp đồng bán ra/2-Hợp đồng mua vào) (CONTRACT_OUTIN in cf_constant)
    outin: { type: Number, default: 1 },

    //_________Phân loại NA (Thực/Gửi dấu) (CONTRACT_TA in cf_constant)
    real: { type: Number, default: 1 },

    //_________Phân loại theo lĩnh vực (type = 3) (POSTMAN -> ITEM - > DOCTYPE)
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },  
    
    //_________Phân loại theo chủ trì (POSTMAN ITEM -> CONTACT)
    chair: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    },
    
    //_________Phân loại theo phụ trách (POSTMAN ITEM -> CONTACT)
    personInCharge: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    },    

    //_________Bên mua (POSTMAN ITEM > CONTACT)
    buyerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },

    //_________Bên bán (POSTMAN ITEM > CONTACT)
    sellerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },

    //_________Công ty-Được xác định theo IPC(*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },

    //_________Dự án-Được xác định theo IPC(*) 
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },

    //_________Hợp đồng-Được xác định theo IPC(*)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },

    /**
     * END THÔNG TIN LẤY TỪ HỢP ĐỒNG
     */

    //_________IPC(*)
    ipc: {
        type: Schema.Types.ObjectId,
        ref : "contract_ipc"
    },

    //_________Nội dung(*)
    name: String,

    //_________Mã hiệu
    sign: String,
    
    //_________Mô tả
    description: String,

    //_________Ngày chuyển tiền (*)
    date: { type: Date, default: Date.now },

    //_________Giá trị chuyển tiền
    value:  { type: Number, default: 0 },

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