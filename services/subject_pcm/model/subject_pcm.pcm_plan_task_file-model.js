"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs }                = require('../../../tools/utils/utils');
    
/**
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_TASK_FILE_COLL = require('../database/subject_pcm.pcm_plan_task_file-coll');

class Model extends BaseModel {

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_TASK_FILE_COLL);
    }

    /**
     * Thêm file: DePV ✅
     * F0211
     */
    insert({ company, project, comment, task, file, authorID }) { 
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
                if(!checkObjectIDs([comment, task, file]))
                    return resolve({ error: true, message: 'Request params comment or task or file invalid', status: 400 });

                if(!checkObjectIDs([company, project, authorID]))
                    return resolve({ error: true, message: 'Request params company or project or authorID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                dataInsert = { company, project, comment, task, file, userCreate: authorID };
                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create task file", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Xóa file: DePV ✅
     * F0213
     */
    remove({ fileID }) { 
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
                if(!checkObjectIDs(fileID))
                    return resolve({ error: true, message: 'Request params fileID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterRemove = await SUBJECT_PCM__PCM_PLAN_TASK_FILE_COLL.findByIdAndDelete(fileID);
                if(!infoDataAfterRemove)
                    return resolve({ error: true, message: "Can't remove file comment", status: 403 });

                return resolve({ error: false, data: infoDataAfterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
}

exports.MODEL = new Model;