"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const PCM_PLAN_GROUP_COLL      = require('../database/subject_pcm.pcm_plan_group-coll');
const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');
const { template } = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    
    constructor() {
        super(PCM_PLAN_GROUP_COLL);
    }

    /**
     * Name: insert group ✅
     * Author: Depv
     * Code:
     */
    insert({ projectID, name, sign, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'projectID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });
                
                let checkExist = await PCM_PLAN_GROUP_COLL.findOne({ project: projectID, name, sign });
                if(checkExist)
                    return resolve({ error: true, message: "Tên và mã hiệu đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED })

                let infoAfterInsert = await this.insertData({ project: projectID, name, sign, userCreate: userID, admins: [userID], members: [userID] });
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: update group ✅
     * Author: Depv
     * Code:
     */
    update({ groupID, name, sign, userID, members, membersRemove, admins, adminsRemove }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'groupID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });
                
                let checkExist = await PCM_PLAN_GROUP_COLL.findOne({ _id: { $ne: groupID }, name, sign });
                if(checkExist)
                    return resolve({ error: true, message: "Tên và mã hiệu đã tồn tại", keyError: KEY_ERROR.ITEM_EXISTED });
                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };
              
                if(name){
                    dataInUpdate.name =name;
                }

                if(sign){
                    dataInUpdate.sign =sign;
                }

                if(checkObjectIDs(members)){
                    dataInUpdate.$addToSet = { members };
                }

                if(checkObjectIDs(membersRemove)){
                    dataInUpdate.$pullAll = { members: membersRemove };
                }
                
                if(checkObjectIDs(admins)){
                    dataInUpdate.$addToSet = { admins };
                }

                if(checkObjectIDs(adminsRemove)){
                    dataInUpdate.$pullAll = { admins: adminsRemove };
                }

                let infoAfterUpdate = await PCM_PLAN_GROUP_COLL.findByIdAndUpdate(groupID, dataInUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }
    
    /**
     * Name: remove group ✅
     * Author: Depv
     * Code:
     */
    remove({ groupID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'groupID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });
                
                let infoAfterRemove = await PCM_PLAN_GROUP_COLL.findByIdAndDelete(groupID);
                if (!infoAfterRemove) 
                    return resolve({ error: true, message: 'Xoá thất bại', keyError: KEY_ERROR.DELETE_FAILED });

                return resolve({ error: false, data: infoAfterRemove });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    };

    /**
     * Name: remove many ✅
     * Author: Depv
     * Code:
     */
    removeMany({ groupsID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(groupsID))
                    return resolve({ error: true, message: 'groupsID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });
                
                let infoAfterRemove = await PCM_PLAN_GROUP_COLL.deleteMany({ _id: { $in: groupsID }});
                if (!infoAfterRemove) 
                    return resolve({ error: true, message: 'Xoá thất bại', keyError: KEY_ERROR.DELETE_FAILED });

                return resolve({ error: false, message: "Xoá thành công" });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    };
    
    /**
     * Name: get info user_pcm_plan_group ✅
     * Author: Depv
     * Code:
     */
    getInfo({ groupID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'param_invalid' });
                
                // populate
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }
            
                let infoPlanGroup = await PCM_PLAN_GROUP_COLL.findById(groupID)
                                    .select(select)
                                    .populate(populates)

                if (!infoPlanGroup) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: infoPlanGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name  : Danh sách user_pcm_plan_group ✅
     * Author: Depv
     * Code  : 
     */
    getList({ userID, projectID, lastestID, keyword, limit = 10, select, populates = {}, isShowAll }) { 
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: "projectID_invalid", keyError: KEY_ERROR.PARAMS_INVALID });

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                    $or: [
                        { members: { $in: [userID] } },
                        { admins: { $in: [userID] } },
                    ]
                };

                // Nếu có trường này thì lấy tất cả group trong dự án mà mình có thể không là members
                if(isShowAll == 1){
                   delete conditionObj.$or;
                }

                let sortBy;
                let keys	 = ['actualFinishTime__-1', '_id__-1'];
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                if(projectID){
                    conditionObj.project = projectID;
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.$and = [
                        {
                            $or: conditionObj.$or
                        },
                        {
                            $or: [
                                { name  :  new RegExp(keyword, 'i') },
                                { sign  :  new RegExp(keyword, 'i') },
                            ]
                        }
                    ]
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_PLAN_GROUP_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await PCM_PLAN_GROUP_COLL
                    .find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy) 
                    .select(select)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", keyError: KEY_ERROR.GET_LIST_FAILED, status: 200 });

				let nextCursor	= null;
				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

                let totalRecord = await PCM_PLAN_GROUP_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;