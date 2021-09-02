[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)
# CBS Microservices [TRIXGO](https://app.trixgo.com)

## **Import Convention**
```javascript

- Same Service (thứ tự file được import):
  + Handler files
  + Model files
  + Database files
  + Helper files

- Other Services ()
   + Handler -> Model -> Database -> Helper

/**
 * * AUTH       : service
 * * USER_COLL  : collection 
 */
const AUTH__USER_COLL                           = require
/**
 * * AUTH        : service
 * * USER_MODEL  : model 
 */
const AUTH__USER_MODEL                          = require

/**
 * Nguyên tắc hiển thị mẩu tin: lấy ví dụ cho Bài viết và comment
 * Bước 1: Lấy API danh sách các bài viết (Post): 10 bài viết/1 trang (Data1)
 * Bước 2: Lấy API danh sách các comment của 10 bài viết đó (Data2)
 * Bước 3: Client (mobile, web reactJS) sẽ xử lý logic để convert Data2 về dạng mảng mới
 * có key là các postID, value: các comment của postID đó, dạng:
 * [
 *  {postID1: [{},{},{},{}]},
 *  {postID2: [{},{},{},{}]},
 *  {postID3: [{},{},{},{}]},
 * [
 */

```

## **Best Use-Cases:**
> Tổng hợp các key Best Practice cho NodeJS - Caching(Redis) - MongoDB

- *[Database]* Method Build API: 
    __Populate Middleware__(thiết lập populate mongodb trong phần setting services) | __Split API__(tách API Category, Product ra riêng)
    --------------------|----------
    Dữ liệu __1-1__ => Populate | Dữ liệu __1-N hoặc N-N__ -> cần phải tách API (cần phải tách ra 1 bảng riêng, thay vì lưu [objectID])
    VD: 1 message - 1 author | VD: 1 message - N media
    Solve: vẫn thiết kế với dạng reference | Solve: thiết kế collection với bảng phụ, VD: message_media

    * Nếu sub-document được đảm bảo với số lượng ít, hoặc kiểm soát (VD: 1 category có tối đa 10 sản phẩm) -> việc phân trang dữ liệu sản phẩm thì cũng không có ý nghĩa -> không cần phân tách API (Chia để trị) => Có thể dùng phương án Populate Middleware

- *[NodeJS]* Partioning: Handle Heavy Task (CPU-Intensive Task)
- *[NodeJS]* CheckValid: 
    * isEmptyObject
    * isInt
    * checkNumberIsValidWithRange: *ví dụ: status cần phải là number và valid với processing(0), success(1), error(-1)*
    * checkDateValid
    * _checkObjectIDs
- *[NodeJS]* PromisePool: handle parallel task tốt hơn so với Promise.all
    * Error Hanler: Promise.all stop khi 1 trong các task error
    * Task Parallel: Khi Batch_1 done với task_1 -> tiếp tục run task_1 của Batch_2, **chứ không đợi Batch_1 done như Promise.all**
- *[MongoDB]* Pagination with Range Queries: 
    * **skip()**: với skip method, fetch dữ liệu càng chậm khi skip càng lớn, VD: skip(1000), bỏ qua 1000 item đầu, nhưng MongoDB Engine vẫn phải scan với 1000 item đầu và lấy những dữ liệu tiếp theo
    * **Cursor-based paging với Range Queries** [MongoDB docs](https://docs.mongodb.com/manual/reference/method/cursor.skip/), [RightWay](https://www.mixmax.com/engineering/api-paging-built-the-right-way/) xem ví dụ:
```javascript
    function printStudents(startValue, nPerPage) {
        let endValue = null;
        db.students.find({ _id: { $lt: startValue } })
            .sort({ _id: -1 })
            .limit(nPerPage)
            .forEach(student => {
                console.log(student.name);
                endValue = student._id;
            });
        return endValue;
    }


    let MaxKey = 100; 

    let currentKey = MaxKey;
    while (currentKey !== null) {
    currentKey = printStudents(currentKey, 10);
    }
```
* *[NodeJS]* API lấy danh sách:
    Trong quá trình triển khai, các **API GET_LIST** sẽ có thể lấy theo status, nên trong trường hợp này cần gửi yêu cầu status='all' để lấy list, còn lại ngoài giá trị all thì truyền các giá trị NUMBER để lấy theo status mong muốn
* *[NodeJS]* Revoke Token:
    * Method 1: Gán Expired Time vào payload (jwt đã hỗ trợ)
    * Method 2: Tạo collection với 2 field: ***userID*** và ***jti(jwt id)***, Quản trị hệ thống có thể revoke theo device hoặc revoke all device(app, web) của user dựa vào bảng này

* *[Queue]* **Bulk -> Batch Process**, [ref](https://github.com/OptimalBits/bull/issues/751):
    * *Problem*: Những tác vụ lập đi lập lại nhiều(mỗi lần cần phải xử lý tác vụ I/O như write DB, ...)
    * *Solution*: Sử dụng cơ chế WRITE-BACK, tương ứng việc tạo QUEUE, các request đẩy vào QUEUE(Bulk), khi Bulk = size thiết lập(ví dụ size batch = 20) -> Tasks.length = 20 -> Chạy Bulk đó với BatchProcess.
* *[NodeJS]* **Anti ReDos**:
    * safe-regex
* *[NodeJS]* **Anti JSON.stringify**:
    * fast-json-stringif
## **Status Code Response**

- 200 OK	Request accepted
- 201 CREATED	This response code is returned from PUT or POST, and indicates that a new resource was created successfully
- 204 NO CONTENT	Indicates that the request was accepted but that there was nothing to return. 

- 400 BAD REQUEST	The request was not valid. 
- 401 UNAUTHORIZED	Is returned from the application server when application security is enabled, and authorization information was missing from the request.
- 403 FORBIDDEN	Indicates that the client attempted to access a resource which they do not have access to. 
- 404 NOT FOUND	Indicates that the targeted resource does not exist.

- 500 INTERNAL SERVER ERROR	An internal error occurred in the server. 