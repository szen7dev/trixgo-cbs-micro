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
 * TOOLS
 */
// const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
// const ITEM__POSITION_COLL            				= require('../database/item.position-coll');
const ITEM__FUNDA_COLL            				    = require('../database/item.funda-coll');

class Model extends BaseModel {

    constructor() {
        super(require('../database/item.funda-coll'));
    }

    getListFundaOfCompany({ companyID }){
        return new Promise(async (resolve) => {
            try {
                if(!ObjectID(companyID))
                    return resolve({ error: true, message: 'param_not_valid' });
                let fundas = await ITEM__FUNDA_COLL.find({ company: companyID }).sort({_id: 'asc'});
                if(!fundas)
                    return resolve({ error: true, message: "cannot_get_list" });
                return resolve({ error: false, data: fundas });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

//     getListByCompany({ companyID }){
//         return new Promise(async (resolve) => {
//             try {
//                 if( !ObjectID.isValid(companyID))
//                        return resolve({ error: true, message: 'param_not_valid' });

//                 let constructPopulateConfigObj = (level, path) => {
//                     /**
//                      * populate multiple paths
//                      * populate: {
//                      *  path: 'childs pm'
//                      * }
//                      */
//                     const oneLevel = () => ({ path });
//                     let obj = oneLevel();

//                     while (level) {
//                         if (level !== 1) {
//                             obj.populate = Object.assign({}, obj);
//                         }
//                         obj = Object.assign({}, obj);
//                         --level;
//                     }
                    
//                     return obj;
//                 };

//                 let levelMax = await ITEM__FUNDA_COLL.aggregate(
//                     [
//                       {
//                         $group:
//                           {
//                             _id: null,
//                             maxLevel: { $max: "$level" }
//                           }
//                       }
//                     ]
//                 )

//                 let listAppMenuParent = await ITEM__FUNDA_COLL.find({ company: companyID,   
//                     $or: [
//                         {
//                             parent: {
//                                 $exists: false
//                             }  
//                         },
//                         {
//                             parent: null
//                         }
//                     ]
//                 })
//                 .populate(
//                     constructPopulateConfigObj(Number(levelMax[0].maxLevel), 'childs')
//                 )

//                 return resolve({ error: false, data: listAppMenuParent, maxLevel: Number(levelMax[0].maxLevel) });
//             } catch (error) {
//                 return resolve({ error: true, message: error.message })
//             }
//         })
//     }
}

exports.MODEL = new Model;
