"use strict";

const BaseModel                                 = require('../../../tools/db/base_model');
const ObjectID                          		= require('mongoose').Types.ObjectId;
const { checkObjectIDs, IsJsonString } 			= require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 } 				= require('../../../tools/cursor_base/playground/index');
const stringUtils					    		= require('../../../tools/utils/string_utils');

const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');

const MEDIA__MENU_COLL					        = require('../database/media.menu-coll');
const MEDIA_COLL					        	= require('../database/media-coll');
const MEDIA_TAG_COLL					       	= require('../database/media.tag-coll');

class Model extends BaseModel {

    constructor() {
        super(MEDIA_COLL)
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

				for(const item of tags){
					await MEDIA_TAG_COLL.findByIdAndUpdate(item, { 
						$addToSet: { posts: infoAfterInserted._id } 
					}, { new: true })
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

				for(const item of tags){
					await MEDIA_TAG_COLL.findByIdAndUpdate(item, { 
						$addToSet: { posts: mediaID } 
					}, { new: true })
				}

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
						// console.log(info)

						if (!info) return resolve({ error: true, message: 'cannot_get' })

						// Cập nhật thêm số lượt xem bài viết
						await MEDIA_COLL.findByIdAndUpdate(info._id, {$inc: { amountView: 1 }}, { new: true })

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

					// Cập nhật thêm số lượt xem bài viết
					await MEDIA_COLL.findByIdAndUpdate(mediaID, {$inc: { amountView: 1 }}, { new: true })

					return resolve({ error: false, data: info })
				}
			} catch (error) {
				return resolve({ error: true, message: error.message });
			}
		})
	}

    /**
     * Name: getList
     * Author: HiepNH
     * Code: 29/3/2025
     */
	getList({ option, companyID, categoryID, menuSlug, keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
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
						if(!option){
							conditionObj.category = infoMenu._id;
						}else{
							let listSubMenu = await MEDIA__MENU_COLL.find({ parent: infoMenu._id })
							conditionObj.category = {$in: listSubMenu.map(item=>item._id)}
						}
					}else{
						conditionObj.category = null
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
     * Name: getListByProperty
     * Author: HiepNH
     * Code: 29/3/2025
     */
	getListByProperty({ option, companyID, menuSlug }){
		return new Promise(async resolve => {
			try {
				let infoMenu = await MEDIA__MENU_COLL.findOne({
					company: ObjectID(companyID),
					slug: menuSlug
				})

				if(infoMenu){
					let conditionObj = {
						company: ObjectID(companyID),
						category: infoMenu._id,
					}
	
					let listData = await MEDIA_COLL.aggregate([
						{
							$match: conditionObj
						},
						{
							$group: {
								_id: { category: '$category' },
								amount: { $sum: 1 },
							}
						},
						{
							$sort: {
								"_id.category": 1
							}
						}
					])
	
					return resolve({ error: false, data: listData })
				}else{
					return resolve({ error: true, message: 'cannot_get' })
				}
			} catch (error) {
				return resolve({ error: true, message: error.message });
			}
		})
	}
}

exports.MODEL = new Model;