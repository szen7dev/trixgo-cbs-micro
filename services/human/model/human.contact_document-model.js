"use strict";

/**
 * EXTERNAL PACKAGE
 */
const moment 										= require("moment");
const ISOdate 										= require('isodate');

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
	 * Func: Danh sách hồ sơ nhân sự
	 * Date: 26/11/2021
	 */
	getListContactDocument({ lastestID, userID, companyID, keyword, type, isExpire, limit = 20, filter = {}, select = {} }){
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

                    let nextInfo = `${infoContactDocument.modifyAt}_${infoContactDocument._id}`;
                    let keys 	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

				if(isExpire){
					let currentDay = ISOdate(moment().endOf('day').format());
					let currentDateAddFourMonth = ISOdate(moment().add(4, 'month').format());

					conditionObj.toDate = {
						$lte: currentDateAddFourMonth,
						$gte: currentDay
					}
				}

				type && (conditionObj.type = type);

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

	/**
	 * Dev: MinhVH
	 * Func: Chi tiết nhân sự
	 * Date: 26/11/2021
	 */
	getInfoContactDocument({ userID, contactID, type, select }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([contactID, userID]))
					return resolve({ error: true, message: 'Request params contactID or userID invalid', status: 400 });

				/**
				 * Hồ sơ chi tiết nhân sự (phân các loại)
				 * 1. Lịch sử làm việc ở các đơn vị
				 * 2. Kinh nghiệm thực tế tham gia tại các Dự án
				 * 3. Lịch sử làm việc theo các Quyết định bổ nhiệm tại các hợp đồng (Chức vụ)
				 * 4. Trình độ học vấn + Chuyên ngành đào tạo
				 * 5. Bằng cấp chứng chỉ
				 * 6. Khác (Bảo hiểm xã hội, tài sản giao nhận, lịch sử tuyển dụng, quá trình làm việc, công tác)
				 */
				const ARR_TYPE_VALID = [1,2,3,4,5,6];

				if (!ARR_TYPE_VALID.includes(type))
					return resolve({ error: true, message: 'Request params type invalid', status: 400 });

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request select invalid', status: 400 });

                    select = JSON.parse(select);
                }

                const infoContact = await CONTACT_DOCUMENT_COLL
                    .findOne({ contact: contactID, type })
                    .populate('company', select.company)
                    .populate('contact', select.contact)
                    .populate('field2', select.field2)
                    .populate('position2', select.position2)
                    .populate('contract', select.contract)
                    .populate('educationalBackground2', select.educationalBackground2)
                    .populate('certificateType', select.certificateType)
                    .populate('certificateName', select.certificateName)
                    .populate('files', select.files)
                    .lean();

                if(!infoContact)
                    return resolve({ error: true, message: "Can't get info contact document", status: 400 });

                return resolve({ error: false, data: infoContact, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;
