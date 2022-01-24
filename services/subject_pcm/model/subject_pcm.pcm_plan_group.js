"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');


const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_GROUP_COLL      = require('../database/subject_pcm.pcm_plan_group-coll');
const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');
const { template } = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_GROUP_COLL);
    }
    
    /**
     * Name: get info user_pcm_plan_group ✅
     * Author: Depv
     * Code:
     */
    getInfo({ planGroupID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(planGroupID))
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
            
                let infoPlanGroup = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.findById(planGroupID)
                                    .select(select)
                                    .populate(populates)

                if (!infoPlanGroup) return resolve({ error: true, message: 'cannot_get' });

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
    getList({ userID, projectID, lastestID, keyword, limit = 10, select, populates={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                    members: { $in: [userID]}, 
                };
                
                let sortBy   = { createAt: -1, _id: -1 };
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
               
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
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                
                let conditionObjOrg = { ...conditionObj};
                
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let keys	 = ['createAt__-1', '_id__-1'];
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				}
                
                let infoDataAfterGet = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .select(select)
                    .populate(populates)
                    .lean(); 
                
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let totalRecord = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.count(conditionObjOrg);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);
                    
				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
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