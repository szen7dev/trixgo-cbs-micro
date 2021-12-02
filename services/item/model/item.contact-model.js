"use strict";

/**
 * EXTERNAL PACKAGE
 */
const moment                                  		= require('moment');
const ISOdate                                  		= require('isodate');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 							= require('../../auth/helper/auth.actions-constant');

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
	getListContact({ 
		lastestID, userID, companyID, departmentID, positionID, contractTypeID, insuranceStatus, gender, keyword, 
		isExpireContract, isUpcomingBirthday, limit = 10, filter = {}, select = {}
	}) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs([companyID]))
					return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                if(departmentID && !checkObjectIDs([departmentID]))
					return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

				if(positionID && !checkObjectIDs([positionID]))
					return resolve({ error: true, message: 'Request params positionID invalid', status: 400 });

				if(contractTypeID && !checkObjectIDs([contractTypeID]))
					return resolve({ error: true, message: 'Request params contractTypeID invalid', status: 400 });

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

				let conditionObj  = { company: companyID };
				let conditionFind = {};
                let objSort = {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
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

                departmentID    && (conditionObj.department 		= departmentID);
                positionID    	&& (conditionObj.position 			= positionID);
                contractTypeID	&& (conditionObj.contractType 		= contractTypeID);
                insuranceStatus	&& (conditionObj.insuranceStatus	= insuranceStatus);
                gender			&& (conditionObj.gender 			= gender);

				let currentDay = ISOdate(moment().endOf('day').format());
				let currentDateAddFourMonth = ISOdate(moment().add(4, 'month').format());

				if(isExpireContract){
					conditionObj.contractExpire = {
						$lte: currentDateAddFourMonth,
						$gte: currentDay
					}
				}

				if(isUpcomingBirthday){
					conditionObj.birthday = {
						$lte: currentDateAddFourMonth,
						$gte: currentDay
					}
				}

				// if(fromDate && toDate){
                //     let firstDayOfYear = `${Number(fromDate)}-01-01T00:00:00.000Z`
                //     let lastDayOfYear = `${Number(toDate)}-12-31T00:00:00.000Z`
                //     let _fromDate   = moment(firstDayOfYear).startOf('day').format();// <=== fix ISODate here
                //     let _toDate     = moment(lastDayOfYear).endOf('day').format();// <=== fix ISODate here
                //     ObjectSearch.createAt = { 
                //         $gte: moment(_fromDate).toDate(),
                //         $lte: moment(_toDate).toDate()
                //     }
                // }

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
                    .populate('field', select.field)
                    .populate('property', select.property)
                    .populate('area', select.area)
                    .populate('area1', select.area1)
                    .populate('area2', select.area2)
                    .populate('linkSale', select.linkSale)
                    .populate('linkUser', select.linkUser)
                    .populate('workingStatus', select.workingStatus)
                    .populate('contractType', select.contractType)
                    .populate('workplace', select.workplace)
                    .populate('educationalBackground', select.educationalBackground)
                    .populate('major', select.major)
                    .populate('documents', select.documents)
                    .populate('seniority', select.seniority)
                    .populate('other', select.other)
                    .populate('files', select.files)
                    .populate('parent', select.parent)
                    .populate('childs', select.childs)
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

	/**
	 * Dev: MinhVH
	 * Func: Chi tiết nhân sự
	 * Date: 26/11/2021
	 */
	getInfoContact({ userID, contactID, select }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([contactID, userID]))
					return resolve({ error: true, message: 'Request params contactID or userID invalid', status: 400 });

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request select invalid', status: 400 });

                    select = JSON.parse(select);
                }

                const infoContact = await ITEM__CONTACT_COLL
                    .findById(documentID)
                    .populate('department', select.department)
                    .populate('company', select.company)
                    .populate('field', select.field)
                    .populate('property', select.property)
                    .populate('area', select.area)
                    .populate('area1', select.area1)
                    .populate('area2', select.area2)
                    .populate('linkSale', select.linkSale)
                    .populate('linkUser', select.linkUser)
                    .populate('workingStatus', select.workingStatus)
                    .populate('contractType', select.contractType)
                    .populate('workplace', select.workplace)
                    .populate('educationalBackground', select.educationalBackground)
                    .populate('major', select.major)
                    .populate('documents', select.documents)
                    .populate('seniority', select.seniority)
                    .populate('other', select.other)
                    .populate('files', select.files)
                    .populate('parent', select.parent)
                    .populate('childs', select.childs)
                    .lean();

                if(!infoContact)
                    return resolve({ error: true, message: "Can't get info contact", status: 400 });

                return resolve({ error: false, data: infoContact, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;
