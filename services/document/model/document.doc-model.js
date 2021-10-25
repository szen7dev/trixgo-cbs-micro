"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;
const moment										= require('moment');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH } 							= require('../../auth/helper/auth.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, IsJsonString }				= require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DOCUMENT__DOC_COLL               				= require('../database/document.doc-coll');

/**
 * MODELS
 */


class Model extends BaseModel {

    constructor() {
        super(DOCUMENT__DOC_COLL);
    }

	/**
	 * Dev: VinhHV
	 * Func: Tạo cuộc hội thoại
	 * Date: ...
	 * Updated: MinhVH - 04/08/2021
	 */
	insertDocument({ name, description, authorID, membersID, isPrivate }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([authorID, ...membersID]) || !membersID || !membersID.length)
                    return resolve({ error: true, message: 'Request params authorID or membersID invalid', status: 400 });

				// Tạo cuộc hội thoại 2 người
				if(isPrivate){
					if(membersID.length > 1)
						return resolve({ error: true, message: 'Number of membersID must equal 1', status: 400 });

					// Kiểm tra nếu tồn tại cuộc hội thoại của hai người thì không tạo nữa
					let checkExistConversation = await DOCUMENT__DOC_COLL
						.findOne({ 
							members: { 
								$all: [authorID, ...membersID],
								$size: 2
							},
						})
						.lean()

					if(checkExistConversation)
						return resolve({ error: false, data: checkExistConversation, status: 200 });

				} else{ // Tạo cuộc hội thoại nhiều hơn hai người ( Nhóm chat )
					if(membersID.length <= 1)
						return resolve({ error: true, message: 'Number of membersID must more than 1', status: 400 });

					if(membersID.length >= 100)
						return resolve({ error: true, message: 'Number of membersID over 100', status: 400 });
				}

                let infoConversationAfterInserted = await this.insertData({ 
					name, 
					description, 
					authors: [authorID],
					members: [...new Set([authorID, ...membersID])]
				});
                if(!infoConversationAfterInserted)
                    return resolve({ error: true, message: "Can't create conversation", status: 403 });

                return resolve({ error: false, data: infoConversationAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


}

exports.MODEL = new Model;