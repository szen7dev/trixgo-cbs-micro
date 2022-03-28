"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }                = require('../../../tools/utils/utils');
const { KEY_ERROR }			            = require('../../../tools/keys');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
 
/**
 * import inter-coll, exter-coll
 */
const PCM_FILE_COLL = require('../database/subject_pcm.pcm_file-coll');

class Model extends BaseModel {

    constructor() {
        super(PCM_FILE_COLL);
    }

    /**
     * Thêm pcm_file: DePV ✅
     */
    insert({ company, project, group, task, comment, file, type, nameOrg, name, authorID }) { 
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { userCreate: authorID };

                if(checkObjectIDs(company)){
                    dataInsert.company = company;
                }

                if(checkObjectIDs(project)){
                    dataInsert.project = project;
                }

                if(checkObjectIDs(group)){
                    dataInsert.group = group;
                }

                if(checkObjectIDs(task)){
                    dataInsert.task = task;
                }

                if(checkObjectIDs(comment)){
                    dataInsert.comment = comment;
                }

                if(checkObjectIDs(file)){
                    dataInsert.file = file;
                }

                if(type){
                    dataInsert.type = type;
                }

                if(nameOrg){
                    dataInsert.nameOrg = nameOrg;
                }

                if(name){
                    dataInsert.name = name;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: KEY_ERROR.INSERT_FAILED, status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Danh sách file pcm: Depv ✅
     */
    getList({
        companyID, projectID, groupID, taskID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }

                let sortBy;
                let conditionObj = { level: 3 };
                let keys	     = ['createAt__-1', '_id__-1'];

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
                
                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_FILE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await PCM_FILE_COLL
                    .find(conditionObj)
                    .select(select)
                    .limit(limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await PCM_FILE_COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);
                
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