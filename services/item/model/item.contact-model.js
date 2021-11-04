"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');

/**
 * COLLECTIONS
 */
const ITEM__CONTACT_COLL            				= require('../database/item.contact-coll');


class Model extends BaseModel {

    constructor() {
        super(ITEM__CONTACT_COLL);
    }

   /**
	 * Dev: MinhVH
	 * Func: Danh sách contact
	 * Date: 29/10/2021
	 */
	getListContact({ lastestID, userID, companyID, departmentID, keyword, limit = 10, filter = {}, select = {} }) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(companyID && !checkObjectIDs([companyID]))
					return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                if(departmentID && !checkObjectIDs([departmentID]))
					return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

				if(isNaN(limit)){
					limit = 10;
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

				let conditionFind = {};
				let conditionObj  = {};
                let objSort = {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoContact = await ITEM__CONTACT_COLL.findById(lastestID);
					if(!infoContact)
						return resolve({ error: true, message: "Can't get info last contact", status: 403 });

					let nextInfo = `${infoContact.modifyAt}_${infoContact._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];  

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

                companyID       && (conditionObj.company = companyID);
                departmentID    && (conditionObj.department = departmentID);

                // SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

				let	listContact = await ITEM__CONTACT_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .populate('department', select.department)
                    .populate('company', select.company)
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				if(!listContact)
					return resolve({ error: true, message: "Can't get list contact", status: 403 });

				// GET TOTAL RECORD
				let totalRecord = await ITEM__CONTACT_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listContact && listContact.length){
					if(listContact.length > limit){
						nextCursor = listContact[limit - 1]._id;
						listContact.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listContact,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

}

exports.MODEL = new Model;
