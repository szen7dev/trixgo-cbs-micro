"use strict";
/**
 * CA LÀM VIỆC
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_shift", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Nội dung
    name: String,
    //_________Ghi chú
    note: String,
    //_________Nhân viên ca trực
    staffs: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Số giờ làm việc của ca
    workingHours: {
        type: Number,
        default: 0
    },
    /**
     * SỐ LIỆU CA
     */
    //______Tiền đầu ca
    openingCash: {
        type: Number,
        default : 0
    },
    //______Phát sinh trong ca
    incurredCash: {
        type: Number,
        default : 0
    },
    //______
    numberOfOpeningSizeM: {
        type: Number,
        default: 0
    },
    //______
    numberOfEndSizeM: {
        type: Number,
        default: 0
    },
    //______
    numberOfOpeningSizeL: {
        type: Number,
        default: 0
    },
    //______
    numberOfEndSizeL: {
        type: Number,
        default: 0
    },
    //_________Số lượng lỗi
    numberOfMistakes: { type: Number, default: 0 },
    //_________Giá trị bị phạt
    amountOfMistakes: { type: Number, default: 0 },
    /**
     * GIÁT TRỊ
     */
    //______Tổng doanh số
    total: {
        type: Number,
        default : 0
    },
    //______Thành tiền (đã trừ giảm giá, triết khấu)
    amount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền
    vatAmount: {
        type: Number,
        default : 0
    },
    /**
     * Bật chiến dịch truyền thông/marketing (được gán từ Funda)
     * 1-Không bật
     * 2-Bật
     */
    campaign: {
        type: Number,
        default: 1
    }, 
    /**
     * Tên chiến dịch (type=20)
     * - Gán chiến dịch đang hiện hành để đo lường (được gán từ Funda)
     */
    campaignName: {
        type: Schema.Types.ObjectId,
        ref : 'doctype'
    }, 
    /**
     * Mùa trong năm (theo lịch âm)
     * 1-Xuân
     * 2-Hạ
     * 3-Thu
     * 4-Đông
     */
    seasons: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại ca làm việc (cập nhật theo funda)
     * 1-Sáng
     * 2-Chiều
     * 3-Tối
     */
    shiftType: {
        type: Number,
        default: 1
    },
    /**
     * THỐNG KÊ
     */
    //______Số lượng sản phẩm (Không tính với product là Topping)
    numberOfProducts: {
        type: Number,
        default: 0
    },
    //______Số đơn hàng
    numberOfOrders: {
        type: Number,
        default: 0
    },
    //______Tiền mặt
    cash: {
        type: Number,
        default : 0
    },
    //______Số đơn Off
    numberOfOrders1: {
        type: Number,
        default: 0
    },
    //______Số đơn Grab
    numberOfOrders2: {
        type: Number,
        default: 0
    },
    //______Số đơn Shopee
    numberOfOrders3: {
        type: Number,
        default: 0
    },
    //______Số đơn Gojek
    numberOfOrders4: {
        type: Number,
        default: 0
    },
    //______Số đơn Baemin
    numberOfOrders5: {
        type: Number,
        default: 0
    },
    //______Số đơn Loship
    numberOfOrders6: {
        type: Number,
        default: 0
    },
    //______Số đơn Bee
    numberOfOrders7: {
        type: Number,
        default: 0
    },
    total1: {
        type: Number,
        default : 0
    },
    total2: {
        type: Number,
        default : 0
    },
    total3: {
        type: Number,
        default : 0
    },
    total4: {
        type: Number,
        default : 0
    },
    total5: {
        type: Number,
        default : 0
    },
    total6: {
        type: Number,
        default : 0
    },
    total7: {
        type: Number,
        default : 0
    },
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