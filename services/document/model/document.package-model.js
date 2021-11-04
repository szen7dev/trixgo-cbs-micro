"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * CONSTANTS
 */

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const {
    checkObjectIDs,
    IsJsonString,
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DOCUMENT__PACKAGE_COLL           				= require('../database/document.package-coll');


class Model extends BaseModel {

    constructor() {
        super(DOCUMENT__PACKAGE_COLL);
    }

    /**
	 * Dev: MinhVH
	 * Func: Lấy danh sách gói thầu
	 * Date: 26/10/2021
	 */
    getListPackage({ departmentID, userID, lastestID, keyword, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(departmentID && !checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

				if(isNaN(limit)) {
					limit = 20;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				let conditionObj 	= { members: { $in: [userID] } };
				let conditionFind 	= {};
				let objSort 	 	= {};
                let sortBy = {
                    modifyAt: -1,
					createAt: -1,
                }

				// GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoConversation = await DOCUMENT__PACKAGE_COLL.findById(lastestID);
                    if(!infoConversation)
                        return resolve({ error: true, message: "Can't get info last package", status: 403 });

                    let nextInfo = `${infoConversation.modifyAt}_${infoConversation._id}`;
                    let keys 	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

                departmentID && (conditionObj.project = departmentID);

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let listPackages = await DOCUMENT__PACKAGE_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await DOCUMENT__PACKAGE_COLL.count(conditionObj);
				let nextCursor	= null;

				if(listPackages && listPackages.length){
					if(listPackages.length > limit){
						nextCursor = listPackages[limit - 1]._id;
						listPackages.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listPackages,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;
