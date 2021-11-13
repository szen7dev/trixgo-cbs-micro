"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');

/**
 * COLLECTIONS
 */
const ITEM__CONTRACT_COLL            				= require('../database/item.contract-coll');


class Model extends BaseModel {

    constructor() {
        super(ITEM__CONTRACT_COLL);
    }

    /**
     * Dev: MinhVH
     * Func: Cập nhật hợp đồng theo điều kiện
     * Date: 29/10/2021
     */
    updateContractByCondition({ condition, update }) {
        return new Promise(async (resolve) => {
            try {
            const infoAfterUpdate = await ITEM__CONTRACT_COLL.findOneAndUpdate(condition, update, { new: true })
                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

   /**
	 * Dev: MinhVH
	 * Func: Danh sách hợp đồng 
	 * Date: 30/08/2021
	 */
	getListContract({ lastestID, userID, departmentID, keyword, limit = 10, filter = {}, select = {} }) {
		return new Promise(async (resolve) => {
			try {
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

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
					let infoContract = await ITEM__CONTRACT_COLL.findById(lastestID);
					if(!infoContract)
						return resolve({ error: true, message: "Can't get info last contract", status: 403 });

					let nextInfo = `${infoContract.modifyAt}_${infoContract._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];  

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

                departmentID && (conditionObj.project = departmentID);

                // SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

				let	listContract = await ITEM__CONTRACT_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .populate('project', select.project)
                    .populate('field', select.field)
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				if(!listContract)
					return resolve({ error: true, message: "Can't get list contract", status: 403 });

				// GET TOTAL RECORD
				let totalRecord = await ITEM__CONTRACT_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listContract && listContract.length){
					if(listContract.length > limit){
						nextCursor = listContract[limit - 1]._id;
						listContract.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listContract,
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
