"use strict";
const BaseModel                 = require('../intalize/base_model');
const ObjectID                  = require('mongoose').Types.ObjectId;
let ChildRouter 			    = require('../../routing/child_routing');
const POST_COLL                 = require('../../database/test//post_coll')
const COMMENT_COLL              = require('../../database/test//comment_coll')
const CATEGORY_COLL             = require('../../database/test/category_coll')

class Model extends BaseModel {

    constructor() {
        super(require('../../database/test/account_coll'))
    }

    async getList(ctx){
        return new Promise(async resolve => {
            try {
                let listPost = await POST_COLL.find({})
                    .populate({
                        path: 'author',
                        select:'fullName',
                    })
                    .populate({
                        path: 'comments',
                        select:'title content',
                    });

                if (!listPost) {
                    return resolve({ error: true, message: 'cannot_get_listPost' });
                }
                return resolve({ error: false, message: 'get_list_posts_success', data: listPost });
            } catch (error) {
            }
        });
    }

    create({title, content, type, authorID}) {
        return new Promise(async resolve => {
            try {
                if (!authorID)
                    return resolve({ error: true, message: 'invalid_object_id' });
                if (!title || !content || !type)
                    return resolve({ error: true, message: 'have_not_completed_all_fields' });
                let dataInsert = {
                    author: authorID, title, content
                }
                if(type)
                    dataInsert.type = Number(type);

                // dataInsert.modifyAt = timeUtils.getCurrentTime();
                // dataInsert.createAt = timeUtils.getCurrentTime();
               
                let newPost = new POST_COLL(dataInsert);
                let infoPostAfterInsert = await newPost.save();
                if (!infoPostAfterInsert) {
                    return resolve({ error: true, message: 'cannot_post' });
                }
                return resolve({ error: false, message: 'post_success' });
            } catch (error) {
            }
        });
    };

    async findById({id}) {
        return new Promise(async resolve => {
            try {

                let infoProduct = await PRODUCT_COLL.findById(id)
                    .populate({
                        path: 'category',
                        select:'name',
                    });
                if(!infoProduct){
                    return resolve({error: true, message:'not_found_product'});
                }
                return resolve({ error: false, message: 'get_info_products_success', data: { product: infoProduct } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
    }

    async remove({postID}){
        return new Promise(async resolve => {
            try {
                if (!postID)
                    return resolve({ error: true, message: 'invalid_object_id' });
                let infoPost =  await POST_COLL.findById(postID);
            
                if(!infoPost)
                    return resolve({ error: true, message: 'can_not_found_Post' });

                let postDel = await POST_COLL.findByIdAndDelete(infoPost._id);

                //xóa tất cả comment trong Post 
                await COMMENT_COLL.deleteMany({ post: { $in: postID }});
                
                if (!postDel) {
                    return resolve({ error: true, message: 'cannot_delete_Post' });
                }
                return resolve({ error: false, message: 'delete_Post_success'});
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async addComment({authorID, postID, content, parent}){
        return new Promise(async resolve => {
            try {
                let newReview = new COMMENT_COLL({ post: postID, author: authorID, content, parent });
                let infoCommentAfterInsert = await newReview.save();
                if(parent){
                    /* Update childs[] cho parent*/
                    await COMMENT_COLL.findByIdAndUpdate(parent, {
                        $addToSet: {
                            childs: infoCommentAfterInsert._id,
                        },
                    }, { new: true });
                }
       
                await POST_COLL.findByIdAndUpdate(postID, {
                    $addToSet: {
                        comments: infoCommentAfterInsert._id
                    }
                }, { new: true });  
              
                return resolve({ error: false, data: infoCommentAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async removeComment({commentID, authorID}){
        return new Promise(async resolve => {
            try {
                let infoCommentRemove = await COMMENT_COLL.findById(commentID);
                if(!infoCommentRemove) 
                    return resolve({ error: true, message: 'can_not_found_comment' });
                if(authorID != infoCommentRemove.author )
                    return resolve({ error: true, message: 'account_is_not_authorized' });
                let commentChild = infoCommentRemove && infoCommentRemove.parent;
                // Nếu comment đang xóa là comment con thì xóa nó ra khỏi comment cha
                if(commentChild || commentChild != undefined){
                    // Nếu comment đang xóa là comment con nhưng còn có con thì xóa hết tất cả con của nó
                    if(infoCommentRemove.childs.length != 0){
                        await COMMENT_COLL.deleteMany({ parent: { $in: infoCommentRemove._id }});
                        for (var i = 0; i < infoCommentRemove.childs.length; i++) {
                            await COMMENT_COLL.deleteMany({ parent: infoCommentRemove.childs[i] });
                            await POST_COLL.findByIdAndUpdate(infoCommentRemove.post, {
                                $pull: {
                                    comments: infoCommentRemove.childs[i]
                                }
                            });
                        }
                    }
                    await COMMENT_COLL.findByIdAndUpdate(infoCommentRemove.parent, {
                        $pull: {
                            childs: commentID
                        }
                    }, { new: true })
                    await COMMENT_COLL.deleteMany({ _id: { $in: infoCommentRemove._id }});
                    await POST_COLL.findByIdAndUpdate(infoCommentRemove.post, {
                        $pull: {
                            comments: commentID
                        }
                    });

                }
                else{
                    if(infoCommentRemove.childs.length != 0){
                        await COMMENT_COLL.deleteMany({ parent: { $in: infoCommentRemove._id }});
                        for (var i = 0; i < infoCommentRemove.childs.length; i++) {
                            await COMMENT_COLL.deleteMany({ parent: infoCommentRemove.childs[i] });
                            await POST_COLL.findByIdAndUpdate(infoCommentRemove.post, {
                                $pull: {
                                    comments: infoCommentRemove.childs[i]
                                }
                            });
                        }
                    }
                    await COMMENT_COLL.deleteMany({ _id: { $in: infoCommentRemove._id }});
                    await POST_COLL.findByIdAndUpdate(infoCommentRemove.post, {
                        $pull: {
                            comments: commentID
                        }
                    });
                }

                return resolve({ error: false, message: 'remove_comment_success' });
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

}

exports.MODEL = new Model;