"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema    = require('mongoose').Schema;

module.exports  = BASE_COLL("file", {
    app: {
        type: Schema.Types.ObjectId,
        ref: 'app'
    },
    company: {
        type:  Schema.Types.ObjectId,
        ref : 'company'
    },
    //_________Đơn vị cơ sở
    funda: {
        type:  Schema.Types.ObjectId,
        ref : 'funda'
    },
    //________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'deparment'
    },
    //________Văn bản
    document: {
        type: Schema.Types.ObjectId,
        ref: 'document_doc'
    },    
    //________Chứng từ
    voucher: {
        type: Schema.Types.ObjectId,
        ref: 'financial_voucher'
    },
    //________Hội thoại
    conversation: {
        type: Schema.Types.ObjectId,
        ref: 'message_conversation'
    },
    //________Nhóm dữ liệu
    planGroup: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_group'
    },
    //________Chủ đề (sau sẽ bỏ)
    topic: {
        type: Schema.Types.ObjectId,
        ref: 'social_topic'
    },
    //________Công việc
    planTask: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_task'
    },
    //________Bài viết (sau sẽ bỏ)
    post: {
        type: Schema.Types.ObjectId,
        ref: 'social_post'
    },
    //________Phản hồi (sau sẽ bỏ)
    response: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_response'
    },
    //________Bình luận
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'comment'
    },
    //________Hàng hóa
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    },
    //________IPC
    ipc: {
        type: Schema.Types.ObjectId,
        ref: 'contract_ipc'
    },
    //________Tài liệu danh bạ
    contactDocument: {
        type: Schema.Types.ObjectId,
        ref: 'contact_document'
    },
	//________Mẫu template
	template: {
		type: Schema.Types.ObjectId,
		ref: 'template'
	},
    //________Điều khoản hợp đồng
    contactCondition: {
        type: Schema.Types.ObjectId,
        ref: 'contact_condition'
    },
    /**
     * DATAHUB
     */
    //________Công tác
    datahubJob: {
        type: Schema.Types.ObjectId,
        ref: 'datahub_job'
    },
    //________Nguồn lực
    datahubProduct: {
        type: Schema.Types.ObjectId,
        ref: 'datahub_product'
    },

    //________Năng lực nhà thầu
    datahubExp: {
        type: Schema.Types.ObjectId,
        ref: 'datahub_exp'
    },
    //________Tác giả
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    
    //________Tên file
    name: String,
    //________Mô tả
    description: String,
    /**
     * Absolte path
     * example: /storage/1233/rtetre/Baocao.docx
     */
    path: String,
    size: {
        type: Number,
        default: 0
    },
    type: {
        type: Number,
        default: 1
    },
    //________File được tích chọn để đánh dấu là bản chính thức/cuối/lưu kho (0/1)
    official: {
        type: Number,
        default: 0
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
}) 