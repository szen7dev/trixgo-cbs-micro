"use strict";

const BaseModel = require("../../../tools/db/base_model");
const ObjectID = require("mongoose").Types.ObjectId;
const moment = require("moment");
const { KEY_ERROR } = require("../../../tools/keys");
const stringUtils					    = require('../../../tools/utils/string_utils');
const {
  checkObjectIDs,
  IsJsonString,
} = require("../../../tools/utils/utils");
const { RANGE_BASE_PAGINATION_V2 } = require("../../../tools/cursor_base/playground/index");

/**s
 * import inter-coll, exter-coll
 */
const MEDIA_MENU_COLL                   = require("../database/media.menu-coll")
const MEDIA_BANNER_COLL                 = require('../database/media.banner-coll')

class Model extends BaseModel {
  constructor() {
    super(MEDIA_BANNER_COLL);
  }

  /**
   * Name: Insert
   * Author: HiepNH
   * Code: 16/10/2024
   */
  insert({ companyID, userID, type, name, note, slug, expired, thumbnailID }) {
    return new Promise(async (resolve) => {
        try {
            let dataInsert = { 
              company: companyID,
              userCreate: userID, 
            }

            if (!isNaN(type)) {
                dataInsert.type = Number(type)
            }

            if (checkObjectIDs(thumbnailID)) {
                dataInsert.thumbnail = thumbnailID;
            }

            if(name && name != ""){
                dataInsert.name = name;
            }

            if(slug && slug != ""){
                dataInsert.slug = slug;
            }

            if(note && note != ""){
                dataInsert.note = note;
            }

            if(expired && expired != ""){
                dataInsert.expired = expired;
            }

            let infoAfterInsert = await this.insertData(dataInsert);
            if (!infoAfterInsert)
                return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

            return resolve({ error: false, data: infoAfterInsert, status: 200 });
        } catch (error) {
            return resolve({ error: true, message: error.message, status: 500 });
        }
    })
  }

  /**
   * Name: Update 
   * Author: HiepNH
   * Code: 16/10/2024
   */
  update({ userID, bannerID, type, name, note, slug, expired, thumbnailID, status, imagesID }) {
      return new Promise(async (resolve) => {
          try {
            const info = await MEDIA_BANNER_COLL.findById(bannerID)
            if(!info) {
                return resolve({
                    error: true,
                    message: 'bannerID không tồn tại',
                    keyError: "bannerID_not_exists",
                    status: 400
                })
            }

            let dataUpdate = { 
                userUpdate: userID, 
                modifyAt: new Date(),
            }

            if(imagesID && imagesID.length) {
                dataUpdate.$addToSet = {
                    images: imagesID,
                }

                if(!checkObjectIDs(thumbnailID)){
                    dataUpdate.thumbnail = imagesID[0];
                }
            }

            if (checkObjectIDs(thumbnailID)) {
                dataUpdate.thumbnail = thumbnailID;
            }

            if(name && name != ""){
                dataUpdate.name = name;
            }

            if(slug && slug != ""){
                dataUpdate.slug = slug;
            }

            if(note && note != ""){
                dataUpdate.note = note;
            }

            if(expired && expired != ""){
                dataUpdate.expired = expired;
            }

            if (!isNaN(status)) {
                dataUpdate.status = Number(status)
            }

            if (!isNaN(type)) {
                dataUpdate.type = Number(type)
            }

            let infoAfterUpdate = await MEDIA_BANNER_COLL.findByIdAndUpdate(bannerID, dataUpdate, { new: true });
            if (!infoAfterUpdate)
                return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

            return resolve({ error: false, data: infoAfterUpdate, status: 200 });
          } catch (error) {
              return resolve({ error: true, message: error.message, status: 500 });
          }
      })
  }

  /**
   * Name: Get info 
   * Author: HiepNH
   * Code: 16/10/2024
   */
  getInfo({ bannerID, select, populates = {} }) {
      return new Promise(async resolve => {
          try {
              if (!checkObjectIDs(bannerID))
                  return resolve({ error: true, message: 'param_invalid' });

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

              let info = await MEDIA_BANNER_COLL.findById(bannerID)
                  .select(select)
                  .populate(populates)

              if (!info) return resolve({ error: true, message: 'cannot_get' });

              return resolve({ error: false, data: info });
          } catch (error) {
              return resolve({ error: true, message: error.message });
          }
      })
  }

  /**
   * Name  : Get list 
   * Author: HiepNH
   * Code: 16/10/2024
   */
  getList({ type, status, companyID, keyword, limit, lastestID, select, populates, sortKey }) {
      return new Promise(async (resolve) => {
          try {
              let sortBy;
              let conditionObj = {company: companyID};
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

              if (sortKey && typeof sortKey === 'string') {
                  if (!IsJsonString(sortKey))
                      return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                  keys = JSON.parse(sortKey);
              }

              if (!isNaN(type)) {
                  conditionObj.type = Number(type)
              }

              if (!isNaN(status)) {
                conditionObj.status = Number(status)
            }

            //   console.log(conditionObj)

              let conditionObjOrg = { ...conditionObj };

              // PHÂN TRANG KIỂU MỚI
              if (lastestID && checkObjectIDs(lastestID)) {
                  let infoData = await MEDIA_BANNER_COLL.findById(lastestID);
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
              // console.log(sortBy)

              let infoDataAfterGet = await MEDIA_BANNER_COLL.find(conditionObj)
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

              let totalRecord = await MEDIA_BANNER_COLL.count(conditionObjOrg);
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
}

exports.MODEL = new Model();