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
const MEDIA_MENU_COLL               = require("../database/media.menu-coll")
const MEDIA_CATE_COLL               = require('../database/media.cate-coll')

class Model extends BaseModel {
  constructor() {
    super(MEDIA_CATE_COLL);
  }

  /**
   * Name: Insert
   * Author: HiepNH
   * Code: 16/10/2024
   */
  insert({ companyID, userID, type, link, thumbnailID }) {
    return new Promise(async (resolve) => {
        try {
            let dataInsert = { 
              company: companyID,
              userCreate: userID, 
              link
            }

            if (!isNaN(type)) {
                dataInsert.type = Number(type)
            }

            if (checkObjectIDs(thumbnailID)) {
                dataInsert.thumbnail = thumbnailID;
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
  update({ userID, cateID, type, link, thumbnailID}) {
      return new Promise(async (resolve) => {
          try {
            const info = await MEDIA_CATE_COLL.findById(cateID)
            if(!info) {
                return resolve({
                    error: true,
                    message: 'cateID không tồn tại',
                    keyError: "cateID_not_exists",
                    status: 400
                })
            }

            let dataUpdate = { 
                userUpdate: userID, 
                modifyAt: new Date(),
                link
            }

            if (!isNaN(type)) {
                dataUpdate.type = Number(type)
            }

            if (checkObjectIDs(thumbnailID)) {
                dataUpdate.thumbnail = thumbnailID;
            }

            let infoAfterUpdate = await MEDIA_CATE_COLL.findByIdAndUpdate(cateID, dataUpdate, { new: true });
            if (!infoAfterUpdate)
                return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

            return resolve({ error: false, data: infoAfterUpdate, status: 200 });
          } catch (error) {
              return resolve({ error: true, message: error.message, status: 500 });
          }
      })
  }

    /**
   * Name: Remove 
   * Author: HiepNH
   * Code: 16/10/2024
   */
  remove({ cateID }) {
    return new Promise(async (resolve) => {
        try {
            if(!checkObjectIDs(cateID))
                return resolve({ error: true, message: 'Mã cateID không hợp lệ', keyError: "cateID_invalid", status: 400 });

            let infoAfterInsert = await MEDIA_CATE_COLL.findByIdAndDelete(cateID);
            if(!infoAfterInsert)
                return resolve({ error: true, message: "can't_delete", status: 403 });

            return resolve({ error: false, data: infoAfterInsert, status: 200 });
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
  getInfo({ cateID, select, populates = {} }) {
      return new Promise(async resolve => {
          try {
              if (!checkObjectIDs(cateID))
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

              let info = await MEDIA_CATE_COLL.findById(cateID)
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
  getList({ type, companyID, keyword, limit, lastestID, select, populates, sortKey }) {
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

            //   console.log(conditionObj)

              let conditionObjOrg = { ...conditionObj };

              // PHÂN TRANG KIỂU MỚI
              if (lastestID && checkObjectIDs(lastestID)) {
                  let infoData = await MEDIA_CATE_COLL.findById(lastestID);
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

              let infoDataAfterGet = await MEDIA_CATE_COLL.find(conditionObj)
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

              let totalRecord = await MEDIA_CATE_COLL.count(conditionObjOrg);
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