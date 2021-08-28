"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("reaction_comment", {
    parent: {
        type: Schema.Types.ObjectId,
        ref : "reaction_comment"
    },
    //_________Hồ số nghiệm thu mẫu
    inspectionTemplateDoc: {
        type: Schema.Types.ObjectId,
        ref : "inspection_template_doc"
    },
    //_________Công việc (PCM)
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    },
    //_________Bài viết (SOCIAL)
    post: {
        type: Schema.Types.ObjectId,
        ref : "social_post"
    },

    //_________Nội dung điều khoản hợp đồng (CONTRACT)
    contractCondition: {
        type: Schema.Types.ObjectId,
        ref : "contract_condition"
    },

    //_________Quản lý văn bản (Document))
    document: {
        type: Schema.Types.ObjectId,
        ref : "document_doc"
    },

    //_________Chứng chỉ thanh toán (Costcontrol)
    ipc: {
        type: Schema.Types.ObjectId,
        ref : "contract_ipc"
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Nội dung
    content: String,
})