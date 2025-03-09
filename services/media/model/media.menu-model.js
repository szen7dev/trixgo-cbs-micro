"use strict";

const BaseModel = require("../../../tools/db/base_model");
const ObjectID = require("mongoose").Types.ObjectId;
const moment = require("moment");
const { KEY_ERROR } = require("../../../tools/keys");
const stringUtils				    = require('../../../tools/utils/string_utils');
const {
  checkObjectIDs,
  IsJsonString,
} = require("../../../tools/utils/utils");
const { RANGE_BASE_PAGINATION_V2 } = require("../../../tools/cursor_base/playground/index");

/**s
 * import inter-coll, exter-coll
 */
const MEDIA_MENU_COLL               = require("../database/media.menu-coll")

class Model extends BaseModel {
  constructor() {
    super(MEDIA_MENU_COLL);
  }

  /**
   * Name: Insert Basic
   * Author: HiepNH
   * Code: 8/9/2024
   */
  insert({ companyID, userID, parentID, name, order, type }) {
    return new Promise(async (resolve) => {
        try {
            if(!name || name == "")
                return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

            // Kiểm tra tên tồn tại trong công ty hay chưa
            let checkName = await MEDIA_MENU_COLL.findOne({ company: companyID, name: name.trim() });
            if(checkName)
                return resolve({ error: true, message: "name_existed" });

            let dataInsert = { 
              company: companyID,
              userCreate: userID,
              name,
            }

            dataInsert.slug = stringUtils.getSlugAccents(name)

            if (!isNaN(type)) {
                dataInsert.type = Number(type)
            }

            if (!isNaN(order)) {
                dataInsert.order = Number(order)
            }

            if(parentID && checkObjectIDs(parentID)){
                let infoParent = await MEDIA_MENU_COLL.findById(parentID);
                dataInsert.parent = parentID;
                dataInsert.level = infoParent.level + 1;
            }

            let infoAfterInsert = await this.insertData(dataInsert);
            if (!infoAfterInsert)
                return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

            //______Cập nhật cho phần tử cha
            if(parentID && checkObjectIDs(parentID)){
                await MEDIA_MENU_COLL.findByIdAndUpdate(parentID, { 
                    $addToSet: { childs: infoAfterInsert._id } 
                }, { new: true });
            }

            return resolve({ error: false, data: infoAfterInsert, status: 200 });
        } catch (error) {
            return resolve({ error: true, message: error.message, status: 500 });
        }
    })
  }

  /**
   * Name: Update 
   * Author: Hiepnh
   * Date: 9/4/2022
   */
  update({ userID, menuID, name, slug, order, type, status, thumbnailID, imagesID }) {
      return new Promise(async (resolve) => {
          try {
            // Kiểm tra xem tên có bị trùng hay không
            let info = await MEDIA_MENU_COLL.findById(menuID);
            if(!info) {
                return resolve({
                    error: true,
                    message: 'menuID không tồn tại',
                    keyError: "menuID_not_exists",
                    status: 400
                });
            }

            let checkName = await MEDIA_MENU_COLL.findOne({
                company: info.company,
                name: name.trim(),
                _id: {
                    $ne: menuID
                }
                });
            if(checkName)
                return resolve({ error: true, message: "name_existed" });

            let dataUpdate = { 
                userUpdate: userID, 
                modifyAt: new Date() 
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

            if (name && name != '') {
                dataUpdate.name = name;
                dataUpdate.slug = stringUtils.getSlugAccents(name)
            }

            if (!isNaN(type)) {
                dataUpdate.type = Number(type)
            }

            if (!isNaN(status)) {
                dataUpdate.status = Number(status)
            }

            if (!isNaN(order)) {
                dataUpdate.order = Number(order)
            }

            let infoAfterUpdate = await MEDIA_MENU_COLL.findByIdAndUpdate(menuID, dataUpdate, { new: true });
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
   * Author: Hiepnh
   * Date: 9/4/2022
   */
  getInfo({ menuID, select, populates = {} }) {
      return new Promise(async resolve => {
          try {
              if (!checkObjectIDs(menuID))
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

              let info = await MEDIA_MENU_COLL.findById(menuID)
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
   * Author: Hiepnh
   * Date: 9/4/2022
   */
  getList({ companyID, parentID, status, keyword, limit, lastestID, populates, select, sortKey }) {
      return new Promise(async (resolve) => {
          try {
              let sortBy;
              let conditionObj = { };
            //   let keys = ['createAt__-1', '_id__-1'];
              let keys = ['createAt__1', '_id__1'];

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

              if (checkObjectIDs(parentID)) {
                conditionObj.parent = parentID;
              } else {
                conditionObj.company = companyID;
              }

             if (!isNaN(status)) {
                conditionObj.status = Number(status)
            }

              if (keyword) {
                  keyword = keyword.split(" ");
                  keyword = '.*' + keyword.join(".*") + '.*';
                  conditionObj.name = RegExp(keyword, 'i');
              }
            //   console.log(conditionObj)

              let conditionObjOrg = { ...conditionObj };

              // PHÂN TRANG KIỂU MỚI
              if (lastestID && checkObjectIDs(lastestID)) {
                  let infoData = await MEDIA_MENU_COLL.findById(lastestID);
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

              let infoDataAfterGet = await MEDIA_MENU_COLL.find(conditionObj)
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

              let totalRecord = await MEDIA_MENU_COLL.count(conditionObjOrg);
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