"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * CONSTANTS
*/
const PERPAGE_CORE              = 20;
/**
 * TOOLS
 */
// const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
const ITEM__GOODS_COLL            				    = require('../database/item.goods-coll');

class Model extends BaseModel {

    constructor() {
        super(require('../database/item.goods-coll'));
    }
     /**
     * Tìm kiếm
     * Hiepnh [x]
     */
    getListWithKey({ companyID, key, belongSystem, limit = PERPAGE_CORE, lastestID }) {
        return new Promise(async resolve => {
            try {
                if(!limit){
                    limit = PERPAGE_CORE;
                }
                if(limit > PERPAGE_CORE){
                    limit = PERPAGE_CORE
                }

                let conditionObj = {};
                if(!companyID){
                    conditionObj.company = companyID;
                    conditionObj.belongSystem = belongSystem;
                }else{
                    conditionObj.company = companyID;
                }

                if(key && key.length > 0){
                    let keyword = key.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                
                let latestRecord = null;
                if(lastestID && ObjectID(lastestID)){
                    const checkExitLastRecord = await ITEM__GOODS_COLL.findById(lastestID);
                    if(!checkExitLastRecord)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });
                    
                    latestRecord = checkExitLastRecord;
                }
               
                const keys = ['createAt__-1', '_id__-1'];
                const resultPagination = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord, objectQuery: conditionObj });
                
                if(resultPagination.eror)
                    return resolve({ error: true, message: "cant_get_list_vat", status: 400 });

                const listGood = await ITEM__GOODS_COLL.find(resultPagination.data.find)
                .select('_id name')
                .sort(resultPagination.data.sort)
                .limit(limit+1);

                if (!listGood)
                    return resolve({ error: true, message: 'cannot_get_data', status: 400  });
                
                const totalRecord = await ITEM__GOODS_COLL.count(conditionObj);
                let nextCursor	= null;

                if(listGood && listGood.length){
                    if(listGood.length > limit){
                        nextCursor = listGood[limit - 1]._id;
                        listGood.length = limit;
                    }
                }

                let totalPage   = Math.ceil(totalRecord/limit);
                return resolve({ 
                    error: false,
                    data: {
                        listGood,
                        nextCursor, 
                        limit: +limit || 0 ,
                        totalRecord,
                        totalPage,
                    }, 
                    status: 200
                });
            } catch (error) {
                console.log(`[ITEM][GOOD]getListWithKey ${error.message}`);
                return resolve({ error: true, message: error.message, status: 400 });
            }
        });
    }

}

exports.MODEL = new Model;
