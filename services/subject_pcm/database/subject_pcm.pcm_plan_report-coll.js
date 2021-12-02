"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_report", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh
    // suid : {
    //     type   : String,
    //     require:  true,
    //     unique : true
    // },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Tên/thư mục/chủ đề
    name: String,
    //_________Mô tả (sử dụng dạng form editor để biên soạn)
    description: String,
    //_________Công việc chứa trong báo cáo
    tasks: [{
        task :  {
            type: Schema.Types.ObjectId,
            ref: 'pcm_plan_task',
        },
        order: { type: Number, default: 1 }
    }],

    //_________tài liệu chứa trong báo cáo
    documents: [{
        document :  {
            type: Schema.Types.ObjectId,
            ref: 'document_doc',
        },
        order: { type: Number, default: 1 }
    }],

    // Highlight task
    active: [{
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_task',
    }],
    //_________Người được phép truy cập/xem (do author phân quyền vào)
    members: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**           
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_report"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_report"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại báo cáo và ghim kết quả tìm kiếm
     * 1-Báo cáo
     * 2-Ghim kết quả tìm kiếm
     * 3-Ghim kết quả tìm kiếm checklist
     * 4-Ghim kết quả tìm kiếm Document
     * 5-Ghim kết quả tìm kiếm hợp đồng
     * 6-Ghim kết quả tìm kiếm comment
     * ----------------NEW-----------------
     * 1 - Nhóm(Thư mục chủ đề)
     * 2 - 
     */        
    type: { type: Number, default: 1 },

     /**
     * Điều kiện tìm kiếm
     * Sau này dùng điều kiện này để tìm kiếm công việc, checklist, document
     */
    conditionPin: {
        type: Object,
    },
    
    /**
     * Xử dụng xóa công việc trong báo cáo động
     */
    tasksRemove: [
        {
            type: Schema.Types.ObjectId,
            ref: "pcm_plan_task"
        }
    ],

    /**
     * Xử dụng xóa checklist trong báo cáo động
     */
    checklistsRemove: [
        {
            type: Schema.Types.ObjectId,
            ref: "pcm_plan_checklist"
        }
    ],

    /**
     * Xử dụng xóa document trong báo cáo động
     */
    documentRemove: [
        {
            type: Schema.Types.ObjectId,
            ref: "pcm_plan_checklist"
        }
    ],

    /**
     * Dùng để lưu 1 mảng tìm kiếm động trong báo cáo
     */
    pins: [
        {
            type: Schema.Types.ObjectId,
            ref: 'pcm_plan_report',
        }
    ],

    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
});