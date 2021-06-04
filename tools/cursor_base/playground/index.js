const { kdf } = require("crypto-js");

let app = express()();

/**
 * @param limit query param
 */
//  demo sort theo ID
app.get('/items', (req, res) => {
    let { limit, next } = req.query;
    limit = limit || 2;

    let condition = {};
    if (next) 
        condition = { ...condition, _id: { $lt: next } }
    // const items = db.items.find({}).sort({
    //     _id: -1
    //  }).limit(limit);
     
    // const next = items[items.length - 1]._id

    const items = db.items.find(condition).sort({
        _id: -1
    }).limit(limit);
      
    const next = items[items.length - 1]._id; //last item in array 
    res.json({ items, next });
});

/**
 * next: giá trị itemID next được trả về từ API /items
 */
// /items?limit=2&next=590e9abd4abbf1165862d342


/**
 * sort theo datetime field bất kỳ
 */
//  Then to fetch the subsequent page we’d call:
//  curl /items?limit=2&sort=createAt&next=2017-09-11T00%3A44%3A54.036Z_590e9abd4abbf1165862d342
 
var next = `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`;
/**
 * nextCreateAt: createAt của phần tử cuối cùng
 * nextID      : id của phần tử cuối cùng
 */

// cần đánh index composeIndex: 'createAt_-1_id_-1'
const [nextCreateAt, nextID] = next.split("_"); 

//demo trên noSQLBootster
db.message_messages.find({
   $or: [{
     createAt: { $lt: ISODate('2021-05-06T10:13:15.000Z') }
   }, {
     // If the createAt is an exact match, we need a tiebreaker, so we use the _id field from the cursor.
     createAt: ISODate('2021-05-06T10:13:15.000Z'),
     _id: { $lt: ObjectId("6093c13b5ad4a270bce70993") }
   }]
}).sort({
    createAt: -1,
    _id: -1, //tránh việc createAt bị trùng -> sort theo thuộc tính 2 là _id
}).limit(10);

//??? TÌM TIN NHẮN TẠI TRANG THỨ ??? -> KHÁNH
//??? Reminder -> nhắc việc
//??? Tạo Thumnail cho các ảnh preview File: excel, word, pdf, ...
  // Package:
  //   - YES: -> field
  //   - NO:
  //     + lấy ảnh thumnail (EVENT) -> RABBITMQ (MESSAING - async task) HEAVY_TASK
  //     + save -> field

//??? ACID Transaction (áp dụng cho các ứng dụng tài chính, kế toán, hợp đồng) - session