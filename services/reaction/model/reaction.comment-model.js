
"use strict";
const ObjectID                                  = require('mongoose').Types.ObjectId;
const REACTION__COMMENT_COLL                    = require('../database/reaction.comment-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                                = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');
 
class Model extends BaseModel {
    constructor() {
        super(require(REACTION__COMMENT_COLL));
    }
    /**
     * Name: Thêm comment
     * Author: Depv
     * Code: F0271
     */
    insert({ content, images, parentID, inspectionTemplateDocID, userID }) {
        const that = this;
        return new Promise(async (resolve) => {
             try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!ObjectID.invalid(userID))
                  return resolve({ error: true, message: "author_invalid" });

                if(!content)
                    return resolve({ error: true, message: "content_invalid" })
                
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                dataInsert.content = content;
                dataInsert.author = userID;

                if(!ObjectID.invalid(parentID)){
                    dataInsert.parent = parentID;
                }

                if(!ObjectID.invalid(inspectionTemplateDocID)){
                    dataInsert.inspectionTemplateDoc = inspectionTemplateDocID;
                }

				if(images){
                    for (const image of images) {
                        let infoAvatarConversation = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, {
                            app: CF_DOMAIN_SERVICES.COMMENT,
                            name: image.name,
                            url: image.url,
                            size: image.size,
                            userID,
                        });

                        if(infoAvatarConversation.error)
						    return resolve({ error: true, message: 'Update avatar conversation failed', status: 403 });
                        // Tiến hành thêm vào hình ảnh vào reaction.comment_file-coll
                    }
				}

                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Sửa comment
     * Author: Depv
     * Code: F0272
     */
    update({ content }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
               /**
                * DECALARTION VARIABLE (1)
                */
               let dataInsert = {};

               /** 
                * VALIDATION STEP (2)
                *  - kiểm tra valid từ các input
                *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                */
               if(!ObjectID.invalid(userID))
                 return resolve({ error: true, message: "author_invalid" });

               if(!content)
                   return resolve({ error: true, message: "content_invalid" })
               
               /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */    
               dataInsert.content = content;
               dataInsert.author = userID;

               if(!ObjectID.invalid(parentID)){
                   dataInsert.parent = parentID;
               }

               if(!ObjectID.invalid(inspectionTemplateDocID)){
                   dataInsert.inspectionTemplateDoc = inspectionTemplateDocID;
               }

               let infoAfterInsert = await that.insertData(dataInsert);
               if(!infoAfterInsert)
                   return resolve({ error: true, message: 'cannot_insert' });
               return resolve({ error: false, data: infoAfterInsert});
           } catch (error) {
               return resolve({ error: true, message: error.message });
           }
       })
    }
}
exports.MODEL = new Model;