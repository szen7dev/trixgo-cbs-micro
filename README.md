[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)
# CBS Microservices [TRIXGO](https://app.trixgo.com)

<!-- Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục -->

## **CÁC BƯỚC TRIỂN KHAI API CHO MỘT SERVICE**
===Lấy item làm mẫu===
1. Xây dựng collection trong thư mục Database
2. Xây dựng Model
3. Xây dựng Handler (bản chất là bước kiểm soát tham biến từ Client truyền lên, option bỏ qua => bắt buộc)
4. Khai báo tại Helper:
- Khai báo tại action
- Khai báo tại routes
- Quản lý các Socket event
- Quản lý các constant theo từng service
5. Đăng ký các service cho hệ thống hiểu => action (item.service)
6. Đăng ký tại auth.alias.js để hệ thống hiểu
7. Đăng ký tại domain.constant.js (1 lần đầu cho servive mới)

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
 * ===> Hoặc có thể dùng lodash group cho tiện (KhanhNEY)
 */
// let arrCommentConvert = []
// listComment.forEach(element=>{
//     let key = element.post
//     if (!Array.isArray(arrCommentConvert[key])) {
//         arrCommentConvert[key] = []
//     }
//     arrCommentConvert[key].push(element)
// })


/**
 * Nguyên tắc get data của API
 * Bước 1: Kiểm tra quyền truy cập dữ liệu (từ 1 action hoặc 1 API khác liên quan phân quyền)
 * Bước 2: Sau khi có quyền hợp lệ => mới cho phép getListData
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


<!-- CONVERT ENDTIME FROM APP_COMPANIES TO APP_USERS -->(xong)
--------------------------------------------------------
let listAppCompany = db.app_companies.find({}).select("app company endTime").toArray()
for(let appCompany of listAppCompany){
    let { app, company, endTime } = appCompany;
    db.app_users.updateMany({  app: ObjectId(app), company: ObjectId(company) }, { $set: { endTime } })
}
--------------------------------------------------------

<!-- UPDATE VALUE TRƯỜNG NÀY CHO TRƯỜNG KIA -->(Xong)
--------------------------------------------------------
db.files.updateMany({nameOrg: {$exists: false}}, [{$set: { nameOrg: "$name" }}]);
--------------------------------------------------------

<!-- CONVERT FILE TO DOCUMENT_FILE -->(Xong)
--------------------------------------------------------
let fileDocuments = db.files.find({ document: {$exists: true, $ne: null} }).toArray()
for(let file of fileDocuments) {
    const { _id, createAt, modifyAt, company, project, author, document, name, type } = file;
    db.document_files.save({
        company,
        project,
        document,
        file: _id,
        type,
        nameOrg: name,
        name,
        author,
        createAt,
        modifyAt,
        isDataConvert: 1
    })
}
--------------------------------------------------------

<!-- Update numberFinishOfDocs cho department -->
--------------------------------------------------------
let listDepartment = db.departments.find({}).select("_id");

listDepartment.forEach(department => {
    let numberFinishOfDocs =  db.document_docs.count({ project: ObjectId(department._id), parent: { $exists: false }, completeStatus: 1 })
    db.departments.findOneAndUpdate({ _id: department._id}, { $set: { numberFinishOfDocs } })
})
--------------------------------------------------------

<!-- Update numberOfDocs cho document_package -->
--------------------------------------------------------
let listDocumentPackages = db.document_packages.find({}).select("_id");

listDocumentPackages.forEach(documentPackage => {
    let numberOfDocs =  db.document_docs.count({ package: ObjectId(documentPackage._id), parent: { $exists: false }})
    db.document_packages.findOneAndUpdate({ _id: documentPackage._id}, { $set: {numberOfDocs} })
})
--------------------------------------------------------

<!-- Update numberOfDocs cho department-coll -->
--------------------------------------------------------
let listDepartment = db.departments.find({}).select("_id");

listDepartment.forEach(department => {
    let numberOfDocs =  db.document_docs.count({ project: ObjectId(department._id), parent: { $exists: false }})
    db.departments.findOneAndUpdate({ _id: department._id}, { $set: {numberOfDocs} })
})
--------------------------------------------------------


<!-- CONVERT COMMENT PCM -->(Xong)
let listcommentPCM = db.comments.find({ task: { $exists: true, $ne: null } }).toArray();

for (const comment of listcommentPCM) {
    let { _id: commentCoreID, content, task, parent, childs, type, official, subType, files, author, userUpdate, createAt, modifyAt } = comment;
    
    let dataInsert = { official, type, task, author, userUpdate, createAt, modifyAt, isDataConvert: 1, commentCoreID, files: [], images: []};
    
    if(content){
        dataInsert.content =content;
    }
    
    if(parent){
        let infoCommentParent = db.pcm_comments.findOne({ commentCoreID: ObjectId(parent) })
        dataInsert.parent =infoCommentParent?._id;
    }
    
    if(subType){
        dataInsert.subType = subType;
    }
    
    if(files && files.length > 0){
        let listFileComment = db.files.find({ _id: { $in: files.map(file => ObjectId(file))} }).toArray();
        for (const file of listFileComment) {
            // db.pcm_files.save(dataInsertFilePcm);
            if(file.type == 1){
                // Hình ảnh 
                dataInsert.images.push(file._id)
                // Tạo file bên pcm_file
            }else{
                // File
               dataInsert.files.push(file._id)
            }
        }
    }
    
    // Tính số lượng reaction
    let amountReaction = db.reactions.count({ comment: comment._id})
    dataInsert.amountReaction = amountReaction;
    
    // Tính số lượng comment con
    if(childs && childs.length){
        dataInsert.amountCommentReply = childs.length;
        dataInsert.lastestReplyID = childs.pop();
    }
    
    db.pcm_comments.save(dataInsert);
}

<!-- CONVERT FILE PCM -->(Xong)
let listFilePCM = db.files.find({ planTask: { $exists: true, $ne: null }}).toArray();

for (const file of listFilePCM) {
    let { _id: fileCoreID, company, project, planGroup: group, planTask: task, type, name , author, createAt, modifyAt } = file;
    db.pcm_files.save({ company, project, group, task, file: fileCoreID, type, nameOrg: name, name, author, isDataConvert: 1, createAt, modifyAt });
}

<!-- CẬP NHẬT SỐ LƯỢNG CONTACT_DOCUMENT CHO CONTACT-->(Xong)
let listContact = db.contacts.find({}).select("_id")

listContact.forEach(contact => {
    let amountWorkHistory =  db.contact_documents.count({ contact: ObjectId(contact._id), type: 1 });
    let amountProjectHistory =  db.contact_documents.count({ contact: ObjectId(contact._id), type: 2 });
    let amountContractHistory =  db.contact_documents.count({ contact: ObjectId(contact._id), type: 3 });
    let amountEducationHistory =  db.contact_documents.count({ contact: ObjectId(contact._id), type: 4 });
    let amountCertificateHistory =  db.contact_documents.count({ contact: ObjectId(contact._id), type: 5 });
    
    db.contacts.findOneAndUpdate({ _id: contact._id}, { $set: {amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory,  amountCertificateHistory } })
})

<!-- PRECALCULATE FOR TASK-->(Xong)
let listTask=  db.pcm_plan_tasks.find({}).toArray();

for (const task of listTask) {
    
    let author = db.users.findOne({ _id: ObjectId(task?.author)})
    let assignee = db.users.findOne({ _id: ObjectId(task?.assignee)})
    
    let amountChecklist = db.pcm_plan_tasks.count({ parent: task._id, type: 2 });
    let amountFinishedChecklist = db.pcm_plan_tasks.count({ parent: task._id, type: 2, status: 3 });
    
    let amountSubtask = db.pcm_plan_tasks.count({ parent: task._id, type: 1 });
    let amountFinishedSubtask = db.pcm_plan_tasks.count({ parent: task._id, type: 1, status: 3 });
    
    let amountResponse = db.pcm_comments.count({ task: task._id, type: 2 });
    let amountMarkedResponse = db.pcm_comments.count({ task: task._id, type: 2, official: 1 });
    
    db.pcm_plan_tasks.findOneAndUpdate({_id: ObjectId(task._id)},
        [
            {
                $set: { 
                    subtype: "$isproposal",
                    companyOfAuthor: author?.company, 
                    companyOfAssignee: assignee?.company, 
                    amountChecklist,
                    amountFinishedChecklist,
                    amountSubtask,
                    amountFinishedSubtask,
                    amountResponse,
                    amountMarkedResponse
                }
                
            }
        ]
    );
}

<!-- UPDATE CONVERSATION-->(Xong)
let listConversations  = db.message_conversations.find({}).toArray();

listConversations.forEach(conversation => {
    let { _id, name, description, members, author, lastMessage, logo, pin, arrMissMessage, arrUserMuteMessage  } = conversation;
    let company = null;
    if(author && author[0]){
        let infoAuthor = db.users.findOne({ _id: ObjectId(author[0])})
        company = infoAuthor?.company;
    }
    
    let isPrivate = true;
    
    if(members && members.length > 2){
        isPrivate = false;
    }
    let isRename = false;
    
    let config = {
        configHighlight: 1,
        configSeeOldMessage: 1,
        configEditInfo: 1,
        configCreateNote: 1,
        configCreatePoll: 1,
        configPinMessage: 1,
        configSendMessage: 1
    }
    
    db.message_conversations.findOneAndUpdate({_id: ObjectId(_id)},{
        $set: { 
            _id, company, authors: author, avatar: logo, messagesPin: pin, usersMissMessage: arrMissMessage, isPrivate, isRename, config,  isDataConvert: 1
        }
    })
})

<!-- UPDATE MESSAGE-->(Xong)
let listMessage = db.message_messages.find({}).toArray();
for(const messageInfo of listMessage){
    let usersSeen = messageInfo.listSeen?.map(item => item);
    if(!usersSeen){
        usersSeen = []
    }
    db.message_messages.findOneAndUpdate({ _id: messageInfo._id }, { $set: { usersSeen, isDataConvert: 1, type: 0 }})
}

<!-- XOÁ TẤT CẢ DỮ LIỆU THÔNG BÁO THÁNG 1 TRỞ VỀ TRƯỚC-->(Xong)
let dateRemove = new Date("2022-2-1");
db.notifications.deleteMany({ createAt: { $lt: dateRemove }})

<!--CONVERT NOTIFICATION-->(Xong)
let listNotification = db.notifications.find({}).toArray();
for(let noti of listNotification){
    let { _id, status, url, type } = noti;
    let taskID = url.substr(18, 24);
    let path = `/pcm/detail/${taskID}`
    let languageKey = type;

    // Api pcm
    let app = '5dfe4b9051dc622100bb9d89';
    
    if(status == 1){
        status = 3;
    }
    
    let mainColl = {
        kind: "pcm_plan_task",
        item: taskID
    };
    
    let isDataConvert = 1;
    let dataUpdate = { path, languageKey, app, status, mainColl, isDataConvert }
    db.notifications.findOneAndUpdate({ _id: ObjectId(_id)}, { $set: dataUpdate })
}

<!--CONVERT APP USER-->(Xong)
let listUser = db.users.find({}).select("company _id").toArray();
let listApp = ["61e049c9fdebf77b072d1b13", "5e47867080019357cce04746", "5dfe4c1b51dc622100bb9d8f", "5dfe4b9051dc622100bb9d89","5df4ce16506d9b3c587948ca"];
let createAt = new Date();
for(let user of listUser){
    let {_id, company } = user;
    for(let appID of listApp){
         db.app_users.insert({ company, app: ObjectId(appID), user: _id, endTime: new Date("2022-12-31"), level: 1, numLog: 0, userCreate: ObjectId("6078102a1283502250f8ba12"), createAt, isDataConvert: 1  })
    }
}


/**
* ============================ ********************************* ==============================
* ============================ 	 CONVERT MESSAGE CONVERSATION  	 ==============================
* ============================ ********************************* ==============================
*/

let listMessages = db.message_messages.find({}).toArray();

for(const infoMessage of listMessages){
    let { _id, listSeen, status, files } = infoMessage;
    let listFiles = [];
    let isImage = false;
    
    if(files && files.length) {
        files.map(file => {
            const fileInfo = db.files.findOne({ _id: ObjectId(file) });

            if(fileInfo) {
                const { name, nameOrg, path, size, type, author } = fileInfo;
                const fileAfterInsert = db.message_conversation_files.insertOne({
                    name,
                    nameOrg,
                    path,
                    size,
                    type,
                    mimeType: type == 1 ? "image/jpeg" : "",
                    conversation: _id,
                    file,
                    author
                })

                if(!isImage && type == 1) {
                    isImage = true;
                }

                listFiles[listFiles.length] = {
                    file: fileAfterInsert.insertedId,
                    status: 1,
                    usersDelete: []
                }
            }
        })
    }

    if(listSeen && listSeen.length) {
        listSeen = [...new Set(listSeen)];
    }

    db.message_messages.findOneAndUpdate({ _id: ObjectId(_id) }, {
        $unset: {
            listSeen: 1,
            bug: 1,
            taskID: 1,
            ticket: 1,
            priority: 1,
            expiredTime: 1,
            fixedbug: 1,
            __v: 1
        },
        $set: {
            usersSeen: listSeen || [],
            usersAssigned: [],
            reactions: [],
            usersDelete: [],
            files: listFiles,
            status: status == 1 ? 2 : 1,
            location: null,
            type: !listFiles.length ? 0 : (isImage ? 1 : 2),
            isDataConvert: 1, 
        }
    }, { returnNewDocument: true })
}


/**
* ============================ **************************==============================
* ============================ 	 CONVERT CONVERSATION  	 ==============================
* ============================ **************************==============================
*/

let listConversations  = db.message_conversations.find({}).toArray();

let config = {
    configHighlight: 1,
    configSeeOldMessage: 1,
    configEditInfo: 1,
    configCreateNote: 1,
    configCreatePoll: 1,
    configPinMessage: 1,
    configSendMessage: 1
}

listConversations.forEach(conversation => {
    let { _id, name, description, members, author, lastMessage, logo, pin, arrMissMessage, arrUserMuteMessage  } = conversation;
    let company = null;

    if(author && author.length && author[0]){
        let infoAuthor = db.users.findOne({ _id: ObjectId(author[0]) })
        company = infoAuthor?.company;
    }
    
    let isPrivate = true;
    let usersMissMessage = [];
    
    if(members && members.length > 2){
        isPrivate = false;
    }
    
    if(arrMissMessage && arrMissMessage.length) {
        arrMissMessage.map(user => {
            usersMissMessage[usersMissMessage.length] = {
                userID: user.userID,
                amount: user.amout
            }
        })
    }
    
    db.message_conversations.findOneAndUpdate({ _id: ObjectId(_id) },{
        $unset: {
            links: 1,
            arrMissMessage: 1,
            taskID: 1,
            arrUserMuteMessage: 1,
            arrMesageTypingUsers: 1,
            __v: 1
        },
        $set: { 
            _id, 
            company, 
            authors: author, 
            avatar: logo, 
            messagesPin: pin ? [pin] : [], 
            usersMissMessage, 
            isPrivate, 
            isRename: false, 
            config,
            folders: [],
            usersMute: [],
            usersHide: [],
            usersDeleteHistory: [],
            lastMessage,
            author: (author && author.length) ? author[0] : null,
            isDataConvert: 1
        }
    }, { returnNewDocument: true })
})



/**
* ============================ *************************************** ===============================
* ============================ 	 CONVERT MEMBERS OF CONVERSATION  	   ===============================
* ============================ *************************************** ===============================
*/


const conversations = db.message_conversations.find({}).toArray()

for(let conversation of conversations) {
    let { _id: conversationID, members, authors, author } = conversation;
    
    if(authors && authors.length) {
        members = [...members, ...authors]
    }
    
    if(!author) {
        author = authors[0];
    }

    members[members.length] = author;
    
    if(members && members.length) {
        for(let memberID of members) {
            const infoUser = db.users.findOne({ _id: memberID })
            const infoMember = db.message_conversation_members.findOne({
                member: memberID,
                conversation: conversationID
            })
            
            if(infoUser && !infoMember) {
                db.message_conversation_members.insertOne({
                    name: infoUser.bizfullname || infoUser.fullname,
                    member: memberID,
                    conversation: conversationID,
                	addedBy: author,
                	type: author.toString() == memberID.toString() ? 'owner' : 'member',
                	timeLastSeen: Date.now(),
                	createAt: new Date()
                })
            }
        }
    }
}