const BASE_COLL = require('../intalize/base-coll');
const Schema    = require('mongoose').Schema;

module.exports  = BASE_COLL("post", {
    title: {
        type: String,
    },
    //_________Nội dung bài viết
    content: {
        type: String,
    },
    //_________File đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],
    //_________Bình luận
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'comment',
        default: null
    }],
    //_________Danh sách người dùng đã bình luận bài viết
    commentUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'account'
    }],
    //_________Các user được tag trong bài viết
    userTags: [{
        type: Schema.Types.ObjectId,
        ref : 'account'
    }],
    //_________Tương tác
    reactions: [{
        type: Schema.Types.ObjectId,
        ref: 'reaction'
    }],
    type: { type: Number, default: 1 },
    /**
     * THÔNG TIN CĂN BẢN
     */
    author: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
});