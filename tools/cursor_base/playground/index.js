// const { kdf } = require("crypto-js");

// let app = express()();

// /**
//  * @param limit query param
//  */
// //  demo sort theo ID
// app.get('/items', (req, res) => {
//     let { limit, next } = req.query;
//     limit = limit || 2;

//     let condition = {};
//     if (next) 
//         condition = { ...condition, _id: { $lt: next } }
//     // const items = db.items.find({}).sort({
//     //     _id: -1
//     //  }).limit(limit);
     
//     // const next = items[items.length - 1]._id

//     const items = db.items.find(condition).sort({
//         _id: -1
//     }).limit(limit);
      
//     const next = items[items.length - 1]._id; //last item in array 
//     res.json({ items, next });
// });

// /**
//  * next: giá trị itemID next được trả về từ API /items
//  */
// // /items?limit=2&next=590e9abd4abbf1165862d342

// /**
//  * sort theo datetime field bất kỳ
//  */
// //  Then to fetch the subsequent page we’d call:
// //  curl /items?limit=2&sort=createAt&next=2017-09-11T00%3A44%3A54.036Z_590e9abd4abbf1165862d342
 
// var next = `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`;
// /**
//  * nextCreateAt: createAt của phần tử cuối cùng
//  * nextID      : id của phần tử cuối cùng
//  */

// // cần đánh index composeIndex: 'createAt_-1_id_-1'
// const [nextCreateAt, nextID] = next.split("_"); 

// //demo trên noSQLBootster
// db.message_messages.find({
//    $or: [{
//      createAt: { $lt: ISODate('2021-05-06T10:13:15.000Z') }
//    }, {
//      // If the createAt is an exact match, we need a tiebreaker, so we use the _id field from the cursor.
//      createAt: ISODate('2021-05-06T10:13:15.000Z'),
//      _id: { $lt: ObjectId("6093c13b5ad4a270bce70993") }
//    }]
// }).sort({
//     createAt: -1,
//     _id: -1, //tránh việc createAt bị trùng -> sort theo thuộc tính 2 là _id
// }).limit(10);

//??? TÌM TIN NHẮN TẠI TRANG THỨ ??? -> KHÁNH
//??? Reminder -> nhắc việc
//??? Tạo Thumnail cho các ảnh preview File: excel, word, pdf, ... (cần demo 1 flow để xử lý)
  // Package:
  //   - YES: -> field
  //   - NO:
  //     + lấy ảnh thumnail (EVENT) -> RABBITMQ (MESSAING - async task) HEAVY_TASK
  //     + save -> field

  /**
   * 
   * @param {*} nextInfo nếu phân trang theo _id -> nextInfo=6093ca895ad4a270bce7234d, 
   *                     nếu nhiều field  -> nextInfo=2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d
   * @param {*} keys ['createAt__-1', '_id__-1']
   * @returns { find: findObject, sort: sortObject }
   */
const RANGE_BASE_PAGINATION = ({ nextInfo, keys }) => {
//   console.log({ nextInfo, keys })
  return new Promise(async resolve => {
    let find = {};
    let sort = {};
    let keysParse = keys.map(key => {
      let [prop, sort] = key.split('__');
      return { prop, sort };
    });

    const KEYWORD_RECOGNITE_VALID = '_';  //EXM: `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`
    if (nextInfo && nextInfo.includes(KEYWORD_RECOGNITE_VALID)) { // other first page
      const listParamsFind = nextInfo.split("_"); //['2021-05-06T10:13:15.000Z', '6093ca895ad4a270bce7234d']
      if (listParamsFind.length == 0) { //* !!listParamsFind == true
        return resolve({ error: true, message: 'param_invalid', valid_example: {
          nextInfo: {
            ['_id']: `6093ca895ad4a270bce7234d`,
            ['-createAt-_id']: `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`
          }, 
          keys: [
            'createAt__-1',
            '_id__-1',
          ]
        } });
      } else { //* !!listParamsFind  == false -> có tồn tại phần tử từ listParamsFind

        if (listParamsFind.length != keys.length) 
          return resolve({ error: true, message: 'param_invalid', valid_example: {
            nextInfo: `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`,
            keys: [`createAt__-1`, '_id__-1']
          } });

        let listParmsAssignWithKey = listParamsFind.map((itemValue, index) => {
          return {
            key: keysParse[index].prop, value: itemValue
          }
        });
        // console.log({ listParmsAssignWithKey })
        /**
         * expected result: 
         *  listParmsAssignWithKey:
         *    key: createAt, value: '2021-05-06T10:13:15.000Z'
         *    key: _id, value: '6093ca895ad4a270bce7234d'
         * 
         */

        const ARRAY_HAVE_ONE_ITEM = 1;
        if (listParmsAssignWithKey.length == ARRAY_HAVE_ONE_ITEM) { //nếu mảng chỉ có 1 item -> đang phân trang theo _id

        } else { //nếu mảng có nhiều item, có thể rơi vào phân trang theo 1 trường bất kỳ (ví dụ: createAt)
          let [firstItemInParam, ...rest] = listParmsAssignWithKey;

          let firstItemInParmAfterFormatDate = new Date(firstItemInParam.value);

          let secondObjInFindMethod = {
            [firstItemInParam.key]: firstItemInParmAfterFormatDate,
          }
          rest.forEach(itemExcludeFirstItem => {
            secondObjInFindMethod = {
              ...secondObjInFindMethod,
              [itemExcludeFirstItem.key]: {
                $lt: itemExcludeFirstItem.value
              }
            }
          });
          //---------------------------------FIND Workspace -------------------//
          find['$or'] = [
            {
              [firstItemInParam.key]: { $lt: firstItemInParmAfterFormatDate } //⚠️ cần check lại mốc thời gian
            }, {
              ...secondObjInFindMethod
            }
          ];
        }
      }
    } else { // first page
      
    } 

    //---------------------------------SORT Workspace -------------------//
    let objectSort = {};
    keysParse.forEach(itemExcludeFirstItem => {
      objectSort = {
        ...objectSort,
        [itemExcludeFirstItem.prop]: [itemExcludeFirstItem.sort][0]
      }
    });
    sort = {
      ...objectSort
    };

    return resolve({ error: false, data: { find, sort }, params: { nextInfo, keys } });
  });
}

// RANGE_BASE_PAGINATION({ nextInfo: `2021-05-06T10:13:15.000Z`, keys: ['createAt__-1'] })
// RANGE_BASE_PAGINATION({ nextInfo: `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`, keys: ['createAt__-1', '_id__-1'] })
//   .then(result => console.log({ result }))
//   .catch(err => console.log({ err }))

exports.RANGE_BASE_PAGINATION = RANGE_BASE_PAGINATION;