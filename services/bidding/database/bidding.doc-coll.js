"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ MỜI QUAN TÂM
 * HỒ SƠ MỜI SƠ TUYỂN
 * HỒ SƠ MỜI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_doc", {
    /**
     * THÔNG TIN CHUNG => LẤY TỪ BIDDING_PLAN SANG
     */
    //_________Lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "datahub_type"
    },      
    //_________Khu vực (xã/phường)
    area: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },    
    //_________Chủ đầu tư
    client: {
        type: Schema.Types.ObjectId,
        ref : "company"
    }, 
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Link tới hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    }, 
    //_________Kế hoạch đầu thầu
    plan: {
        type: Schema.Types.ObjectId,
        ref: "bidding_plan"
    },
    //_________Quản trị
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    //_________Thành viên được quyền xem ngân sách
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    /**
     * THÔNG TIN GÓI THẦU
     */    
    //_________Tên hồ sơ
    name: String,
    //_________Ký hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //_________Thời điểm phát hành
    releaseTime: { type: Date, default: null },
    //_________Thời điểm đóng thầu
    closingTime: { type: Date, default: null },
    /**
     * HỆ SỐ CHI PHÍ (%)
     * Phục vụ phân tích nguồn lực và tính giá
     */
    //_________Chi phí trực tiếp khác
    factor1: { type: Number, default: 0 },
    //_________Chi phí chung
    factor2: { type: Number, default: 0 },
    //_________Chi phí nhà tạm để ở/Điều hành thi công
    factor3: { type: Number, default: 0 },
    //_________Chi phí khác
    factor4: { type: Number, default: 0 },
    //_________Lợi nhuận
    factor5: { type: Number, default: 0 },
    /**
     * THÔNG TIN NHÀ THẦU
     */
    //_________Nhà thầu trúng thầu
    bidder: {
        type: Schema.Types.ObjectId,
        ref : "company"
    }, 
    //_________Giá trúng thầu
    tenderPrice: { type: Number, default: 0 },  
    //_________VAT
    vatTenderPrice: { type: Number, default: 0 },      
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