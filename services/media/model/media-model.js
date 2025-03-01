"use strict";

/**
 * EXTERNAL PACKAGE
 */
// const PromisePool								= require('@supercharge/promise-pool');
// const ObjectID                          		= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
// const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');
// const { CF_ACTIONS_ITEM }               		= require('../../item/helper/item.actions-constant');
// const { MEDIA_TYPES }							= require('../helper/media.keys-constant');
// const { APP_KEYS, LANGUAGE_KEYS, KEY_ERROR }	= require('../../../tools/keys');
// const { ENV_DEVICE_WEB_CBS } 					= require('../../notification/helper/notification.keys-constant');

/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString } = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 } 				= require('../../../tools/cursor_base/playground/index');
const stringUtils					    		= require('../../../tools/utils/string_utils');

/**
 * COLLECTIONS
 */
const MEDIA__MENU_COLL					        = require('../database/media.menu-coll');
const MEDIA_COLL					        	= require('../database/media-coll');
const MEDIA__SEEN_COLL					       	= require('../database/media.seen-coll');
const MEDIA__SAVE_COLL					    	= require('../database/media.save-coll');
// const MEDIA__FILE_COLL					        = require('../database/media.file-coll');
// const MEDIA__REACIONT_COLL              		= require('../database/media.reaction-coll');

class Model extends BaseModel {

    constructor() {
        super(MEDIA_COLL);
    }

		/**
	 * Dev: MinhVH
	 * Func: THÊM BÀI VIẾT MỚI
     * Updated: 24/02/2022
	 */
	insert({ companyID, userID, categoryID, title, content, tags, summary, description, thumbnailID, status }) {
		return new Promise(async (resolve) => {
			try {
				let checkName = await MEDIA_COLL.findOne({ company: companyID, title: title.trim() });
				if(checkName)
					return resolve({ error: true, message: "title_existed" });

				let dataInsert = {
					company: companyID,
					author: userID,
					title,
					content,
					slug: stringUtils.getSlugAccents(title)
				}

				if (!isNaN(status)) {
					dataInsert.status = Number(status)
				}

				if (checkObjectIDs(tags)) {
					dataInsert.tags = tags;
				}

				if (checkObjectIDs(categoryID)) {
					dataInsert.category = categoryID;
				}

				if (checkObjectIDs(thumbnailID)) {
					dataInsert.thumbnail = thumbnailID;
				}

				if (summary && summary != '') {
					dataInsert.summary = summary;
				}

				if (description && description != '') {
					dataInsert.description = description;
				}

				let infoAfterInserted = await this.insertData(dataInsert);
				if(!infoAfterInserted) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
				}

				return resolve({ error: false, data: infoAfterInserted, status: 200 });
			} catch (error) {
				console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: CHỈNH SỬA BÀI VIẾT
     * Updated: 24/02/2022
	 */
	update({ userID, mediaID, categoryID, title, content, tags, summary, description, thumbnailID, status }) {
        return new Promise(async (resolve) => {
            try {
				let infoMedia = await MEDIA_COLL.findById(mediaID)
				if (!infoMedia)
					return resolve({ error: true, message: 'can_not_get_info' })

				let checkName = await MEDIA_COLL.findOne({
					company: infoMedia.company,
					title: title.trim(),
					_id: {
						$ne: mediaID
					}
					});
				if(checkName)
					return resolve({ error: true, message: "title_existed" });

				let dataUpdate = {
					userUpdate: userID,
					modifyAt: new Date()
				}

				if (title && title != '') {
					dataUpdate.title = title;
					dataUpdate.slug = stringUtils.getSlugAccents(title)
				}

				if (checkObjectIDs(tags)) {
					dataUpdate.tags = tags;
				} else {
					dataUpdate.tags = [];
				}

				if (checkObjectIDs(categoryID)) {
					dataUpdate.category = categoryID;
				}

				if (content && content != '') {
					dataUpdate.content = content;
				}

				if (summary && summary != '') {
					dataUpdate.summary = summary;
				}

				if (description && description != '') {
					dataUpdate.description = description;
				}

				if (!isNaN(status)) {
					dataUpdate.status = Number(status)
				}

				if (checkObjectIDs(thumbnailID)) {
					dataUpdate.thumbnail = thumbnailID;
				}

				let infoAfterUpdate = await MEDIA_COLL.findByIdAndUpdate(mediaID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
					return resolve({ error: true, message: "Cập nhật thất bại" })

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: CẬP NHẬT LƯỢT XEM BÀI VIẾT
     * Updated: 24/02/2022
	 */
	updateView({ mediaID, authorID }) {
        return new Promise(async resolve => {
            try {
                // Cập nhật số lượng view
				await MEDIA_COLL.findByIdAndUpdate(mediaID, {
					$inc: {
						amountView: 1
					}
				});

				return resolve({
					error: false,
					status: 200,
					message: "success"
				});
			} catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Name: Get info
	 * Author: Hiepnh
	 * Date: 9/4/2022
	 */
	getInfo({ companyID, mediaID, slug, select, populates }) {
		// console.log({ companyID, mediaID, slug, select, populates })
		return new Promise(async resolve => {
			try {
				if (populates && typeof populates === 'string') {
					if (!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else {
					populates = {
						path: "",
						select: ""
					}
				}

				if (!checkObjectIDs(mediaID)){
					if(slug && slug != ''){
						let info = await MEDIA_COLL
						.findOne({ company: companyID, slug: slug.trim() })
						.select(select)
						.populate(populates)
						.lean();
						console.log(info)

						if (!info) return resolve({ error: true, message: 'cannot_get' })

						return resolve({ error: false, data: info })
					}else{
						return resolve({ error: true, message: 'cannot_get' })
					}
				}else{
					let info = await MEDIA_COLL
					.findById(mediaID)
					.select(select)
					.populate(populates)
					.lean();

					if (!info) return resolve({ error: true, message: 'cannot_get' })

					return resolve({ error: false, data: info })
				}
			} catch (error) {
				return resolve({ error: true, message: error.message });
			}
		})
	}

	getList({ companyID, categoryID, menuSlug, keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
		// console.log({companyID, categoryID, menuSlug, keyword, limit, lastestID, select, populates, sortKey})
		return new Promise(async (resolve) => {
			try {
				let sortBy;
				let conditionObj = {};
				let keys = ['createAt__-1', '_id__-1'];

				if (limit > 50) {
					limit = 50
				} else {
					limit = +limit;
				}

				if (populates && typeof populates === 'string') {
					if (!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else {
					populates = {
						path: "",
						select: ""
					}
				}

				if (checkObjectIDs(categoryID)) {
					conditionObj.category = categoryID;
				} else{
					conditionObj.company = companyID;
				}

				if(menuSlug){
					let infoMenu = await MEDIA__MENU_COLL.findOne({ company: companyID, slug: menuSlug})
					if(infoMenu){
						conditionObj.category = infoMenu._id;
					}
				}

				if (sortKey && typeof sortKey === 'string') {
					if (!IsJsonString(sortKey))
						return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

					keys = JSON.parse(sortKey);
				}

				if (keyword) {
					keyword = keyword.split(" ");
					keyword = '.*' + keyword.join(".*") + '.*';
					conditionObj.title = RegExp(keyword, 'i');
				}
				// console.log(conditionObj)
				let conditionObjOrg = { ...conditionObj };

				// PHÂN TRANG KIỂU MỚI
				if (lastestID && checkObjectIDs(lastestID)) {
					let infoData = await MEDIA_COLL.findById(lastestID);
					if (!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if (!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				} else {
					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy = dataPagingAndSort.data.sort;
				}

				let infoDataAfterGet = await MEDIA_COLL.find(conditionObj)
					.limit(limit + 1)
					.sort(sortBy)
					.select(select)
					.populate(populates)
					.lean();

				if (!infoDataAfterGet)
					return resolve({ error: true, message: "Can't get data", status: 403 });

				let nextCursor = null;
				if (infoDataAfterGet && infoDataAfterGet.length) {
					if (infoDataAfterGet.length > limit) {
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

				let totalRecord = await MEDIA_COLL.count(conditionObjOrg);
				let totalPage = Math.ceil(totalRecord / limit);

				return resolve({
					error: false, data: {
						listRecords: infoDataAfterGet,
						limit,
						totalRecord,
						totalPage,
						nextCursor,
					}, status: 200
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH NGƯỜI XEM BÀI VIẾT
	 */
	getListUsersSeen({ authorID, mediaID, lastestID, limit = 15, select, populates }) {
		return new Promise(async resolve => {
			try {
				/**
                 * DECALARTION VARIABLE (1)
                 */
				let conditionObj = { media: mediaID };
				let keys = ['_id__-1', 'createAt__-1'];
				let sortBy = {};
				let nextCursor	= null;

				/**
				 * VALIDATION STEP (2)
				 *  - Kiểm tra valid từ các input
				 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
				 */
				if(!checkObjectIDs([mediaID])) {
					return resolve({
						error: true,
						message: "Tham số mediaID không hợp lệ",
						keyError: "params_mediaID_invalid",
						status: 400
					})
				}

				if(!checkObjectIDs([authorID])) {
					return resolve({
						error: true,
						message: "Tham số authorID không hợp lệ",
						keyError: "params_authorID_invalid",
						status: 400
					})
				}

				if(limit > 20 || isNaN(limit)){
					limit = 20;
				} else {
					limit = +limit;
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: "",
						select: ""
					}
				}

				let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA__SEEN_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
				}

				let infoDataAfterGet = await MEDIA__SEEN_COLL.find(conditionObj)
					.limit(limit + 1)
					.sort(sortBy)
					.select(select)
					.populate(populates)
					.lean();

				if(!infoDataAfterGet) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurs",
						status: 422
					})
				}

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

				let totalRecord = await MEDIA__SEEN_COLL.count(conditionObjOrg);

				return resolve({ error: false, data: {
					listRecords: infoDataAfterGet,
					limit,
					totalRecord,
					nextCursor,
				}, status: 200 });
			} catch (error) {
				return resolve({ error: true, error: error.message, status: 500 });
			}
		})
	}

	// /**
	//  * Dev: MinhVH
	//  * Func: LẤY DANH SÁCH BÀI VIẾT
    //  * Updated: 24/02/2022
	//  */
    // getListMedia({ authorID, lastestID, companyID, departmentID, otherID, mediaID, keyword, isRelated, type, limit = 20, select, populates }){
    //     return new Promise(async resolve => {
    //         try {
	// 			//=======================VARIABLE/CONSTANTS===================
	// 			let conditionObj  = {};
	// 			let nextCursor = null;
	// 			let keys = ['modifyAt__-1', 'createAt__-1'];
	// 			let sortBy = {
	// 				modifyAt: -1,
	// 				createAt: -1,
	// 			};

	// 			if(isNaN(limit) || +limit > 20){
	// 				limit = 20;
	// 			} else{
	// 				limit = +limit;
	// 			}

	// 			//=======================VALIDATION===========================
	// 			if(populates && typeof populates === 'string'){
	// 				if(!IsJsonString(populates))
	// 					return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

	// 				populates = JSON.parse(populates);
	// 			} else{
	// 				populates = {
	// 					path: "",
	// 					select: ""
	// 				}
	// 			}

	// 			if(!checkObjectIDs([authorID])) {
	// 				return resolve({
	// 					error: true,
	// 					message: "Tham số authorID không hợp lệ",
	// 					keyError: "params_authorID_invalid",
	// 					status: 400
	// 				})
	// 			}

	// 			if(companyID) {
	// 				if(!checkObjectIDs([companyID])) {
	// 					return resolve({
	// 						error: true,
	// 						message: "Tham số companyID không hợp lệ",
	// 						keyError: "params_companyID_invalid",
	// 						status: 400
	// 					})
	// 				}

	// 				conditionObj.company = companyID;
	// 			}

	// 			if(departmentID) {
	// 				if(!checkObjectIDs([departmentID])) {
	// 					return resolve({
	// 						error: true,
	// 						message: "Tham số departmentID không hợp lệ",
	// 						keyError: "params_departmentID_invalid",
	// 						status: 400
	// 					})
	// 				}

	// 				conditionObj.department = departmentID;
	// 			}

	// 			if(otherID) {
	// 				if(!checkObjectIDs([otherID])) {
	// 					return resolve({
	// 						error: true,
	// 						message: "Tham số otherID không hợp lệ",
	// 						keyError: "params_otherID_invalid",
	// 						status: 400
	// 					})
	// 				}

	// 				conditionObj.other = otherID;
	// 			}

	// 			// let infoUser = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
	// 			// 	authorID: authorID,
	// 			// 	select: "company fullname friends",
	// 			// });

	// 			switch (type) {
	// 				case 'company':
	// 					conditionObj.type = 1;
	// 					break;
	// 				case 'department':
	// 					conditionObj.type = 2;
	// 					break;
	// 				case 'digital-conversion':
	// 					conditionObj.type = 3;
	// 					break;
	// 				case 'system':
	// 					conditionObj.type = 4;
	// 					break;
	// 				case 'just-me':
	// 					conditionObj.type = 5;
	// 					conditionObj.author = authorID;
	// 					break;
	// 				case 'internal-company':
	// 					conditionObj.type = { $in: [1,2] };
	// 					break;
	// 				default:
	// 					break;
	// 			}

	// 			if(isRelated) {
	// 				const infoMedia = await MEDIA_COLL
	// 					.findById(mediaID)
	// 					.select('type')
	// 					.lean();

	// 				if(infoMedia) {
	// 					conditionObj._id = { $nin: [mediaID] };
	// 					conditionObj.type = infoMedia.type;
	// 				}
	// 			}

	// 			if(keyword){
    //                 keyword = keyword.split(" ");
    //                 keyword = '.*' + keyword.join(".*") + '.*';
    //                 conditionObj.title = new RegExp(keyword, 'i');
    //             }

    //             let conditionObjOrg = { ...conditionObj };
	// 			if(lastestID && checkObjectIDs(lastestID)){
	// 				let infoData = await MEDIA_COLL.findById(lastestID);
	// 				if(!infoData)
	// 					return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

	// 				let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
	// 				if(!dataPagingAndSort || dataPagingAndSort.error)
	// 					return resolve({ error: true, message: "Can't get range pagination", status: 400 });

	// 				conditionObj  = dataPagingAndSort.data.find;
	// 				sortBy        = dataPagingAndSort.data.sort;
	// 			} else{
	// 				let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
	// 				sortBy        = dataPagingAndSort.data.sort;
	// 			}

	// 			const listDataAfterGet = await MEDIA_COLL
	// 				.find(conditionObj)
	// 				.limit(limit + 1)
	// 				.sort(sortBy)
	// 				.select(select)
	// 				.populate(populates)
	// 				.lean();

	// 			if(!listDataAfterGet) {
	// 				return resolve({
	// 					error: true,
	// 					message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
	// 					keyError: "error_occurs",
	// 					status: 422
	// 				})
	// 			}

	// 			if(listDataAfterGet && listDataAfterGet.length){
	// 				if(listDataAfterGet.length > limit){
	// 					nextCursor = listDataAfterGet[limit - 1]._id;
	// 					listDataAfterGet.length = limit;
	// 				}
	// 			}

	// 			const totalRecord = await MEDIA_COLL.count(conditionObjOrg);

	// 			return resolve({ error: false, data: {
	// 				listRecords: listDataAfterGet,
	// 				limit,
	// 				totalRecord,
	// 				nextCursor
	// 			}, status: 200 });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }

	/**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH LƯU BÀI VIẾT
     * Date: 24/02/2022
	 */
	getListSaveMedia({ authorID, lastestID, limit = 20, select, populates }) {
        return new Promise(async resolve => {
			try {
				/**
                 * DECALARTION VARIABLE (1)
                 */
				let conditionObj = { author: authorID };
				let keys = ['_id__-1', 'createAt__-1'];
				let sortBy = {};
				let nextCursor	= null;

				/**
				 * VALIDATION STEP (2)
				 *  - Kiểm tra valid từ các input
				 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
				 */
				if(!checkObjectIDs([authorID])) {
					return resolve({
						error: true,
						message: "Tham số authorID không hợp lệ",
						keyError: "params_authorID_invalid",
						status: 400
					})
				}

				if(limit > 20 || isNaN(limit)){
					limit = 20;
				} else {
					limit = +limit;
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: "",
						select: ""
					}
				}

				let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA__SAVE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
				}

				let infoDataAfterGet = await MEDIA__SAVE_COLL
					.find(conditionObj)
					.limit(limit + 1)
					.sort(sortBy)
					.select(select)
					.populate(populates)
					.lean();

				if(!infoDataAfterGet) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurs",
						status: 422
					})
				}

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

				let totalRecord = await MEDIA__SAVE_COLL.count(conditionObjOrg);

				return resolve({ error: false, data: {
					listRecords: infoDataAfterGet,
					limit,
					totalRecord,
					nextCursor,
				}, status: 200 });
			} catch (error) {
				return resolve({ error: true, error: error.message, status: 500 });
			}
		})
    }

	/**
	 * Dev: MinhVH
	 * Func: LƯU BÀI VIẾT
     * Date: 24/02/2022
	 */
	saveMedia({ authorID, mediaID, isSave }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let infoMediaAfterInserted = null;
				let conditionObj = {
					media: mediaID,
					author: authorID
				}

				//=========================VALIDATION==========================
				if(!checkObjectIDs([authorID])) {
					return resolve({
						error: true,
						message: "Tham số authorID không hợp lệ",
						keyError: "params_authorID_invalid",
						status: 400
					})
				}

				if (!checkObjectIDs([mediaID])) {
					return resolve({
						error: true,
						message: "Tham số mediaID không hợp lệ",
						keyError: "params_mediaID_invalid",
						status: 400
					})
				}

				let checkExisted = await MEDIA_COLL.findById(mediaID);
				if (!checkExisted) {
					return resolve({
						error: true,
						message: "Bài viết không tồn tại",
						keyError: "media_not_exists",
						status: 400
					})
				}

				if(isSave) {
					// Tạo lưu bài viết nếu chưa tồn tại
					infoMediaAfterInserted = await MEDIA__SAVE_COLL.findOneAndUpdate(conditionObj, {
						$set: {
							modifyAt: new Date()
						},
						$setOnInsert: {
							...conditionObj,
							createAt: new Date()
						}
					}, { new: true, upsert: true });
				} else {
					infoMediaAfterInserted = await MEDIA__SAVE_COLL.findOneAndDelete(conditionObj);
				}

                if(!infoMediaAfterInserted) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
				}

                return resolve({ error: false, data: infoMediaAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH BÀI VIẾT ĐÃ GHIM
     * Date: 24/02/2022
	 */
	getListPinMedia({ authorID, limit = 20, lastestID, select, populates, ctx }) {
        return new Promise(async (resolve) => {
            try {
				let listMediaPin = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_PIN_MEDIA}`);
				if(listMediaPin.error || !listMediaPin.data?.length) return resolve(listMediaPin);

				/**
				 * DECALARTION VARIABLE (1)
				 */
				let conditionObj = { _id: { $in: listMediaPin.data } };
				let keys = ['_id__-1', 'createAt__-1'];
				let nextCursor	= null;
				let sortBy = {};

				/**
				 * VALIDATION STEP (2)
				 *  - Kiểm tra valid từ các input
				 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
				 */
				if(!checkObjectIDs([authorID])) {
					return resolve({
						error: true,
						message: "Tham số authorID không hợp lệ",
						keyError: "params_authorID_invalid",
						status: 400
					})
				}

				if(limit > 20 || isNaN(limit)){
					limit = 20;
				} else {
					limit = +limit;
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: "",
						select: ""
					}
				}

				let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
					let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
				}

				let infoDataAfterGet = await MEDIA_COLL
					.find(conditionObj)
					.limit(limit + 1)
					.select(select)
					.populate(populates)
					.lean();

				if(!infoDataAfterGet) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurs",
						status: 422
					})
				}

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

				let totalRecord = await MEDIA_COLL.count(conditionObjOrg);

				return resolve({ error: false, data: {
					listRecords: infoDataAfterGet,
					limit,
					totalRecord,
					nextCursor,
				}, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: GHIM BÀI VIẾT
     * Date: 24/02/2022
	 */
	pinMedia({ userID, mediaID, isPin, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=========================VALIDATION==========================
				if(!checkObjectIDs([userID])) {
					return resolve({
						error: true,
						message: "Tham số userID không hợp lệ",
						keyError: "params_userID_invalid",
						status: 400
					})
				}

				if (!checkObjectIDs([mediaID])) {
					return resolve({
						error: true,
						message: "Tham số mediaID không hợp lệ",
						keyError: "params_mediaID_invalid",
						status: 400
					})
				}

				const checkExisted = await MEDIA_COLL.findById(mediaID);
				if (!checkExisted) {
					return resolve({
						error: true,
						message: "Bài viết không tồn tại",
						keyError: "media_not_exist",
						status: 400
					})
				}

				const infoUserAfterUpdated = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.UPDATE_PIN_MEDIA}`, {
					mediaID, userID, isPin
				});

				return resolve(infoUserAfterUpdated);
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;