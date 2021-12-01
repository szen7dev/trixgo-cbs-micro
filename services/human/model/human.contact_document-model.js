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
const CONTACT_DOCUMENT_COLL           				= require('../database/human.contact_document-coll');


class Model extends BaseModel {

    constructor() {
        super(CONTACT_DOCUMENT_COLL);
    }

    /**
	 * Dev: MinhVH
	 * Func: Danh sách hồ sơ nhân sự sắp hết hạn
	 * Date: 26/11/2021
	 */
	getListHumanByExpireDocument({ lastestID, userID, companyID, keyword, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

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

				let conditionObj 	= { company: companyID };
				let conditionFind 	= {};
				let objSort 	 	= {};
                let sortBy = {
                    modifyAt: -1,
					createAt: -1,
                }

				// GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoContactDocument = await CONTACT_DOCUMENT_COLL.findById(lastestID);
                    if(!infoContactDocument)
                        return resolve({ error: true, message: "Can't get info last contact document", status: 403 });

                    let nextInfo = `${infoPackage.modifyAt}_${infoPackage._id}`;
                    let keys 	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let listContactDocument = await CONTACT_DOCUMENT_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
					.populate('company', select.company)
					.populate('contact', select.contact)
					.populate('field2', select.field2)
					.populate('position2', select.position2)
					.populate('contract', select.contract)
					.populate('educationalBackground2', select.educationalBackground2)
					.populate('certificateType', select.certificateType)
					.populate('certificateName', select.certificateName)
					.populate('files', select.files)
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await CONTACT_DOCUMENT_COLL.count(conditionObj);
				let nextCursor	= null;

				if(listContactDocument && listContactDocument.length){
					if(listContactDocument.length > limit){
						nextCursor = listContactDocument[limit - 1]._id;
						listContactDocument.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listContactDocument,
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
