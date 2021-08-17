 "use strict";

 /**
  * EXTERNAL PACKAGE
  */
 const fs                                            = require('fs');
 const path                                          = require('path');
 const PromisePool									= require('@supercharge/promise-pool');
 
 /**
  * CONSTANTS
  */
 const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
 const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
 
 /**
  * TOOLS
  */
 const { RANGE_BASE_PAGINATION }                     = require('../../../tools/cursor_base/playground/index');
 const { calculateCurrentPage } 						= require('../../../tools/utils/calculate_current_page');
 const { 
     objectID, 
     checkObjectIDs, 
     checkNumberIsValidWithRange 
 } = require('../../../tools/utils/utils');
 
 /**
  * BASE
  */
 const BaseModel                                     = require('../../../tools/db/base_model');
 
 /**
  * COLLECTIONS
  */
 const INSPECTION__TEMPLATE_DOC_COLL                 = require('../database/inspection.template_doc-coll');
 const FILE__FILE_COLL                               = {};
 
 /**
  * MODELS
  */
//  const CHATTING__CONVERSATION_FILE_MODEL				= require('../model/chatting.conversation_file-model').MODEL;

 /**
 * DECALARTION VARIABLE (1)
 */
/** 
 * VALIDATION STEP (2)
 *  - kiểm tra valid từ các input
 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
 */
/**
 * LOGIC STEP (3)
 *  3.1: convert type + update name (ví dụ: string -> number)
 *  3.2: operation database
 */    

 class Model extends BaseModel {

    constructor() {
        super(CHATTING__MESSAGE_COLL);
    }

 
        insert({ }) { 
            const that = this;
            return new Promise(async (resolve) => {
                try {
                    
                } catch (error) {
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }

 }