// const { kdf } = require("crypto-js");

let _ = require('lodash');

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
    console.log({ nextInfo, keys })
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
              key: keysParse[index].prop, value: itemValue // key: createAt, value: 2021-05-06T10:13:15.000z
            }
          });
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


  /**
   * func thực hiện chuyển đổi:
   *  sortValue: 1 -> $gt
   *  sortValue: -1 -> $lt
   */
  const _getOperationWithSort = ({ sortValue }) => {
    if (!Number.isNaN(Number(sortValue))) {
      if (sortValue == 1) {
        return '$gt';
      } else if (sortValue == -1) {
        return '$lt';
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /**
   * ['createAt__-1', '_id__-1']
   *  -> {
   *         createAt: -1,
   *         -id: -1
   *     }
   */
  const _getObjSearchByKeys = ({ keysParse }) => {
    let objectSort = {};
    keysParse.forEach(itemExcludeFirstItem => {
      objectSort = {
          ...objectSort,
          [itemExcludeFirstItem.prop]: [itemExcludeFirstItem.sort][0]
      }
    });

    return objectSort;
  }

  /**
   * Func cập nhật các bugs liên quan
   *  - không sortBy ngược lại
   *  - không sortBy theo field khác ngoài field createAt
   * --------------------------FLOW RẼ NHÁNH-------------------
   *  - UNIQUE (là các field có giá trị không trùng lặp tại 1 collection) (VD: _id, username, email, ...)
   *      + ONLY PAGINATION (func chỉ phân trang)
   *      + QUERY & PAGNIATION (func gồm filter)
   *  - NON_UNIQUE (VD: createAt, fullname, ...)
   *      + ONLY PAGINATION (func chỉ phân trang)
   *      + QUERY & PAGNIATION (func gồm filter)
   *
   * @params
   *    1/ keys  (require)
   *        VD:(non-unique) ['createAt__-1', '_id__-1']
   *        VD(unique): ['_id__-1'], ['_id__1']
   *    2/ latestRecord (require)
   *    3/ objectQuery (optional)
   *
   * @returns object {find, sort}
   */

  const RANGE_BASE_PAGINATION_V2 = ({ keys, latestRecord, objectQuery }) => {
  console.log("🚀 ~ file: index.js ~ line 241 ~ latestRecord")
    let resultForReturn = {
      find: {},
      sort: {}
    };
    /**
     * Kiểm tra keys có bao nhiêu phần tử
     *  - 1: là unique field
     *  - 2 || n: là non-unique field
     */

    const LENGTH_PARAMS_PAGINATION = keys && keys.length;
    const IS_UNIQUE_FIELD          = LENGTH_PARAMS_PAGINATION == 1 ? true : false;
    const IS_FIRST_PAGE            = (latestRecord && _.get(latestRecord, '_id', 0) != 0) ? false : true;
    console.log("🚀 ~ file: index.js ~ line 255 ~ IS_FIRST_PAGE", IS_FIRST_PAGE)
    const IS_EXISTS_QUERY          = (objectQuery && (typeof objectQuery)) ? true : false;

    /**
     * tokenzation keys: là tách objectQuery
     */
    let keysParse = keys.map(key => {
      let [prop, sort] = key.split('__');
      return { prop, sort };
    });

    if (IS_UNIQUE_FIELD) { // là unique field
      if (IS_FIRST_PAGE) {
        /**
         * vì nếu là IS_UNIQUE_FIELD -> keysParse luôn luôn là 1 item, VD:
         *   { username: -1 } hoặc { _id: -1 }
         */
        resultForReturn.sort = {
          ...resultForReturn.sort,
          [keysParse[0]['prop']]: keysParse[0]['sort']
        }
        resultForReturn.find = {
          ...resultForReturn.find,
        }
      } else {
        resultForReturn.sort = {
          ...resultForReturn.sort,
          [keysParse[0]['prop']]: keysParse[0]['sort']
        }


        //---------------CONVERT -> FIND (begin)--------//
        /**
         * keysParse: ['_id__-1']
         * fieldNameKeysParse: '_id'
         *  -> valueOfLatestRecordWithFieldName: 60b5114ce27803187c3e1b3e
         */
        let fieldNameOfKeysParse = keysParse[0]['prop']; //_id, hoặc unique_field khác
        let ValueOfKeysParse     = keysParse[0]['sort']; // value của unique_field
        let valueOfLatestRecordWithFieldName = latestRecord[fieldNameOfKeysParse];
        let operationWithConditionSort = _getOperationWithSort({ sortValue: ValueOfKeysParse });

        resultForReturn.find = {
          ...resultForReturn.find,
          [keysParse[0]['prop']]: {
            [operationWithConditionSort]: valueOfLatestRecordWithFieldName
          }
        }
      }
    } else { //là non-unique field
      //------convert string -> object sort
      resultForReturn.sort = {
        ...resultForReturn.sort,
        ..._getObjSearchByKeys({ keysParse })
      }
      if (IS_FIRST_PAGE) {
        //------(end)convert string -> object sort
        resultForReturn.find = {
          ...resultForReturn.find,
        }
      } else {
        //---------------CONVERT -> FIND (begin)--------//
         /**
         * keysParse: ['_id__-1']
         * fieldNameKeysParse: '_id'
         *  -> valueOfLatestRecordWithFieldName: 60b5114ce27803187c3e1b3e
         */
          let fieldNameOfKeysParse = keysParse[0]['prop']; //_id, hoặc unique_field khác
          let ValueOfKeysParse     = keysParse[0]['sort']; // value của unique_field
          let valueOfLatestRecordWithFieldName = latestRecord[fieldNameOfKeysParse];
          let operationWithConditionSort = _getOperationWithSort({ sortValue: ValueOfKeysParse });

          resultForReturn.find = {
            ...resultForReturn.find,
            $or: [
              {
                [fieldNameOfKeysParse]: {
                  [operationWithConditionSort]: valueOfLatestRecordWithFieldName
                }
              },
              {
                [fieldNameOfKeysParse]:  valueOfLatestRecordWithFieldName,

                // keysParse[1]['prop']: luôn luôn là _id
                [keysParse[1]['prop']]: {
                  [operationWithConditionSort]: latestRecord[keysParse[1]['prop']] // <-- hard code
                }
              }
            ]
          }
      }
    }

    // TODO objectQuery: vì cả 2 đều dùng func này cho $and: []
    if (IS_EXISTS_QUERY) {
      let objectPaginationBefore = resultForReturn.find;

      let objFindAfterAddQuery   = {
        $and: [
          {
            ...objectQuery
          },
          {
            ...objectPaginationBefore
          }
        ]
      }
      return ({ error: false, data: { find: objFindAfterAddQuery, sort: resultForReturn.sort } });
    } else {
      return ({ error: false, data: { find: resultForReturn.find, sort: resultForReturn.sort } });
    }

  }

  exports.RANGE_BASE_PAGINATION     = RANGE_BASE_PAGINATION;
  exports.RANGE_BASE_PAGINATION_V2  = RANGE_BASE_PAGINATION_V2;


  // ---------EXAMPLE USE V2------//
  // let keys = ['_id__-1']; ['username__1']
  // let keys = ['createAt__-1', '_id__-1'];
  // let latestRecord = { _id: '60b5114ce27803187c3e1bab', name: 'khanhney', createAt: '14/01/2012' }
  // let objectQuery = {
  //   username: 'lucde'
  // }
  // let result = RANGE_BASE_PAGINATION_V2({ keys, latestRecord, objectQuery })

  /**
   * expected:
   *  - find: { username: { $lt: "khanhney" } }
   *  - sort: { username: -1 }
   */

  // console.log("🚀 ~ file: index.js ~ line 298 ~ result", JSON.stringify(result))