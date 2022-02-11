"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */

const INSPECTION__DOC_COMMENT_COLL      = require('../database/inspection.doc_comment-coll');
const INSPECTION__DOC_COMMENT_FILE_COLL = require('../database/inspection.doc_comment_file-coll');
const INSPECTION__DOC_MODEL             = require('../model/inspection.doc-model').MODEL;

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__DOC_COMMENT_COLL);
    }
    
    /**
     * Name: Thêm comment ✅
     * Author: Depv
     * Code: F0236
     */
    insert({ inspection, comment, parent }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(comment, inspection))
                    return resolve({ error: true, message: 'Request params inspection or comment invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataInsert = { comment, inspection };
                if(parent){
                    dataInsert.parent = parent;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create comment", status: 403 });

                // Cập nhật lastMessage cho docs spection
                await INSPECTION__DOC_MODEL.update({ docID: inspection, lastComment: infoDataAfterInserted._id });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name: Xóa template docs: ✅
     * Author: DePV
     * Code: F0237
     */
    remove({ commentID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'Request params commentID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterUpdate = await INSPECTION__DOC_COMMENT_COLL.findByIdAndDelete(commentID);
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove comment", status: 403 });

                return resolve({ error: false, data: "Remove success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Thông tin comment template doc ✅
     * Author: Depv 
     * Code: F0238
     */
    getInfo({ commentID }) { 
        return new Promise(async (resolve) => {
            try {   

                /**
                 * DECALARTION VARIABLE (1)
                 */
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'Request params commentID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoCommentDoc = await INSPECTION__DOC_COMMENT_COLL.findById(commentID).populate({
                    path: "comment",
                    select: "_id content author amountChilds amountReactions createAt",
                    populate: {
                        path: "author",
                        select: "fullname",
                    }
                }).lean();

                if(!infoCommentDoc)
                    return resolve({ error: true, message: "Can't get comment doc", status: 403 });

                let infoDataAfterGetAfterMapFile = [];
                let fileOfComment = await INSPECTION__DOC_COMMENT_FILE_COLL.find({ comment: infoCommentDoc._id }).select("file")
                                    .populate({
                                        path: "file",
                                        select: "name path createAt"
                                    });

                    infoDataAfterGetAfterMapFile.push({ ...infoCommentDoc, files: [...fileOfComment.map(item => item)]})

                return resolve({ error: false, data: infoDataAfterGetAfterMapFile[0], status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách template docs  ✅
     * Author: DePV
     * Code: F0239
     * problem: Bị hạn chế không thể sort createAt = 1
     */
    getListComment({ inspectionID, limit = 100, lastestIDComment, parentID  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { inspection: inspectionID };
                let conditionFind = {};
                let sortBy = { createAt: -1 };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
                if(parentID){
                    conditionObj.parent  = parentID;
                    conditionFind.parent = parentID;
                }

				if(lastestIDComment && checkObjectIDs(lastestIDComment)){
					let infoMessage = await INSPECTION__DOC_COMMENT_COLL.findById(lastestIDComment);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}
                
                let infoDataAfterGet = await INSPECTION__DOC_COMMENT_COLL.find({...conditionObj, ...conditionFind })
                    .select("amountChilds amountReactions comment createAt")
                    .populate({
                        path: "comment",
                        select: "_id content author amountChilds amountReactions createAt",
                        populate: {
                            path: "author",
                            select: "fullname",
                        }
                    })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();
                
                // Map hình ảnh với comment
                let infoDataAfterGetAfterMapFile = [];
                for (const comment of infoDataAfterGet) {
                    let fileOfComment = await INSPECTION__DOC_COMMENT_FILE_COLL.find({ comment: comment._id }).select("file")
                                        .populate({
                                            path: "file",
                                            select: "name path createAt"
                                        });

                    infoDataAfterGetAfterMapFile.push({ ...comment, files: [...fileOfComment.map(item => item)]})
                }

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__DOC_COMMENT_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__DOC_COMMENT_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get comment", status: 403 });
                
                let totalPage = Math.ceil(totalRecord/limit);
                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit });
                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGetAfterMapFile,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    currentPage
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model; 