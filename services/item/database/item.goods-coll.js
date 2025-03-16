"use strict";

const { duration } = require('moment');
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  HÀNG HOÁ, SẢN PHẨM, TÀI SẢN, CÔNG CỤ DỤNG CỤ,...
 */
module.exports  = DATABASE_MIDDLEWARE("goods", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Cơ sở: chưa rõ để làm gì ??? => để quản lý thiết bị của từng Điểm bán => quản lý khấu hao
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref: "department"
    },
    //_________Đơn vị cơ sở/Cửa hàng được quyền truy cập
    fundas: [{
        type: Schema.Types.ObjectId,
        ref : "funda"
    }],
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
     * Phân loại
     * 1-Thông thường
     * 2-Topping
     */
    type: {
        type: Number,
        default : 1
    },
    /**
     * Phân loại tài sản, công cụ,...
     * 1. Tài sản
     * 2. Vật tư chính
     * 3. Vật tư phụ/Nguyên liệu nhiên liệu
     * 4. Công cụ dụng cụ
     * 5. Hàng hóa/Cấu kiện/Thành phẩm
     * 6. Văn phòng phẩm
     */
    subtype: {
        type: Number,
        default : 1
    },
    /**
     * Kích cỡ
     * 1-Size M$
     * 2-Size L
     */
    size: {
        type: Number,
        default : 1
    },
    //_________Chuyên mục
    category: {
        type    : Schema.Types.ObjectId,
        ref     : 'media_menu'
    },
    //_________Tên
    name: String,
    //_________Slug/URL (SEO)
    slug: String,
    //_________Nội dung
    namecv: String,
    //_________Mã hiệu
    sign: String,    
    //_________Đơn vị
    unit: String,   
    //_________Ghi chú đơn vị
    unitNote: String,   
    //_________Ghi chú
    note: String,
    /**
     * PHARMA
     */
    //_________Mô tả sản phẩm
    description: String,
    //_________Đặc điểm nổi bật
    features: String,
    //_________Thành phần
    ingredients: String,
    //_________Công dụng/lợi ích
    benefits : String,
    //_________Cách dùng
    instructions: String,
    //_________Tác dụng phụ 
    sideEffects: String,
    //_________Lưu ý
    warnings: String,
    //_________Bảo quản
    storage: String,
    //_________Ngày bắt đầu đưa vào sử dụng/hạch toán
    date: { type: Date, default: Date.now },
    //_________Number of depreciation months: số tháng khấu hao
    nods: { type: Number, default: 0 },
    //_________Đơn giá nhập
    unitprice: { type: Number, default: 0 },
    //_________Đơn giá xuất bán
    sellingUnitprice: { type: Number, default: 0 },
    //_________Đơn giá niêm yết
    listedUnitprice: { type: Number, default: 0 },
    //_________Thời hạn ưu đãi
    expired: Date,
    //_________Số lượng đã bán ra
    quantitySold: { type: Number, default: 0 },
    //_________Rating chất lượng phục vụ
    rating: { type: Number, default: 0 },
    //_________Số lượng đánh giá
    numberOfRating: { type: Number, default: 0 },
    //_________Số lượng comment
    amountComment: { type: Number, default: 0 },
    //_________Giảm giá
    discount: { type: Number, default: 0 },
    //_________Tỷ lệ Giảm giá
    discountRate: { type: Number, default: 0 },
    //______Đơn giá: M, Off
    unitPrice: {
        type: Number,
        default : 0
    },
    //______Đơn giá 2: M, App
    unitPrice2: {
        type: Number,
        default : 0
    },
    //______Đơn giá 3: L, Off
    unitPrice3: {
        type: Number,
        default : 0
    },
    //______Đơn giá 4: L, App
    unitPrice4: {
        type: Number,
        default : 0
    },
    //_________Số lượng phần tử con
    amountChilds: {
        type: Number,
        default: 0 
    },
    //_________Link
    convert: {
        type: Schema.Types.ObjectId,
        ref: "goods"
    },
    //_________Định mức chuyển đổi
    convertQuantity: { type: Number, default: 1 },
    //_________Số lượng
    quantity: { type: Number, default: 1 },
    //_________Trọng lượng
    weight: { type: Number, default: 0 },
    //______Mục đích sử dụng (1-Chung, 2-Đơn hàng)
    usage: {
        type: Number,
        default : 1
    },
    //______Trạng thái (1-ON, 2-OFF)
    status: {
        type: Number,
        default : 1
    },
    //_________Thumbnail
    thumbnail: {
        type: Schema.Types.ObjectId,
        ref: 'file'
    },
    //_________Hình ảnh
    images: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    // /**
    //  * HỆ THỐNG QUẢN LÝ
    //  */
    // //_________Do hệ thống quy định hay không (giá trị 1 hoặc trường company = null)
    // // belongSystem: { type: Number, default: 0 },
    // /**
    //  * THÔNG TIN CĂN BẢN
    //  */
    // //_________Mã link với phân loại chi phí của hệ thống
    // linkSystem: {
    //     type: Schema.Types.ObjectId,
    //     ref: "goods"
    // },
    // //_________Có phải là mẫu hay không
    // template: { type: Number, default: 0 },
    /**
     * THÔNG TIN
     */
    // //______Sử dụng cho khách hàng (1-Sử dụng, 2-Không)
    // forCustomer: {
    //     type: Number,
    //     default : 1
    // },
    // //_________Tác giả
    // author: {
    //     type: Schema.Types.ObjectId,
    //     ref : 'user'
    // },
    // //_________Thời lượng (giờ)
    // duration: { type: Number, default: 0 },
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