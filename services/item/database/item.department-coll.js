"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * DỰ ÁN/PHÒNG BAN
 */

module.exports  = DATABASE_MIDDLEWARE("department", {
      //_________ Công ty  
      company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "department"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "department"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    /**
     * PHÂN LOẠI PHỤC VỤ BÁO CÁO
     */
    /**
     * Phân loại
     * 1-Phòng ban
     * 2-Dự án
     */
    type: { type: Number, default: 1 },
    /**
     * Giai đoạn dự án
     * https://www.letsbuild.com/blog/6-stages-of-a-project-in-construction
     * https://designeverest.com/blog/what-are-the-stages-of-a-construction-project/
     * 1-The concept of a project
     * 2-Design
     * 3-Pre-construction stage
     * 4-Procurement stage
     * 5-Construction stage
     * 6-Post-construction stage
     */
    stage: { type: Number, default: 1 },
    /**
     * Ontime
     * 1-Ontime
     * 2-Offtime
     */
    ontime: { type: Number, default: 1 },
    /**
     * Onbudget
     * 1-Onbudget
     * 2-Offbudget
     */
    onbudget: { type: Number, default: 1 },  
    /**
     * Trạng thái triển khai
     * 1-Đang triển khai
     * 2-Bàn giao
     * 3-Hoàn thành
     * 4-Tạm dừng
     */
    status: { type: Number, default: 1 },
    /**
     * Nhóm dự án
     * 1-Quan trọng quốc gia
     * 2-Nhóm A
     * 3-Nhóm B
     * 4-Nhóm C
     */
    projectType: { type: Number, default: 1 },
    /**
     * Nguồn vốn
     * 1-Ngân sách
     * 2-Tư nhân
     * 3-...
     * 4-...
     */
    projectCapital: { type: Number, default: 1 },
    /**
     * Loại công trình
     * 1-Dân dụng
     * 2-...
     * 3-...
     * 4-...
     */
    buildingType: { type: Number, default: 1 },
    /**
     * Cấp công trình
     */
    buildingGrade: { type: Number, default: 1 },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Hợp đồng
    contracts: [{
        type: Schema.Types.ObjectId,
        ref : "contract"
    }],
    //_________Nhóm công việc
    planGroups: [{
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_group"
    }],
    //_________Gói văn bản/tài liệu
    packages: [{
        type: Schema.Types.ObjectId, 
        ref : "document_package"
    }],
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    //_________Ký hiệu
    sign: String,
    //_________Chủ đầu tư
    owner: String,
    //_________Địa chỉ theo google map
    location: String,
    //_________Địa chỉ dự án/phòng ban
    address: String,
    //_________Khu vực dự án/phòng ban
    area: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Kế hoạch bắt đầu
    startTime: { type: Date, default: null },
    //_________Kế hoạch kết thúc
    expiredTime: { type: Date, default: null },
    //_________Thực tế bắt đầu
    actualStartTime: { type: Date, default: null },
    //_________Thực tế kết thúc
    actualFinishTime: { type: Date, default: null },
    //_________Trưởng dự án/phòng ban
    pm: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    //_________Phụ trách chấm công/Trợ lý của PM
    assistant: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    //_________Tổng mức đầu tư
    investmentAmount: {
        type   : Number,
        default: 0
    },
    //_________Ghi chú
    note: String,
    //_________Chức vụ của thành viên trong Dự án/phòng ban
    position: [{
        user :  {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        name: String,
    }],
    //_________Hình ảnh đại diện
    image: {
        type: String,
        defautl: 'project_default.png'
    },
    //_________Hình ảnh đại diện (2021)
    files: {
        type: Schema.Types.ObjectId,
        ref: 'file',
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