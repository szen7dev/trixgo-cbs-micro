"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;


/**
 * import inter-coll, exter-coll
 */
const AUTH__USER_COLL                   = require('../database/auth.user-coll');
const AUTH__COMPANY_COLL                = require('../database/auth.company-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
// const { checkValidPhoneNumber, validEmail, removeUtf8AndJoinSpace, makeid, randomStringFixLengthCode } = require('../../../tools/utils/string_utils');
const { randomStringFixLengthCode } 
                                        = require('../../../tools/utils/string_utils');
const timeUtils                         = require('../../../tools/utils/time_utils');
const { hash, compare }                 = require('../../../tools/bcrypt');
const { sign, verify }                  = require('../../../tools/jwt');
const { RANGE_BASE_PAGINATION }         = require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, checkNumberIsValidWithRange, IsJsonString }                
                                        = require('../../../tools/utils/utils');
const { 
    PLATFORM_TRIXGO, PLATFORM_WYNDIX,
    LEVEL_ADMIN, LEVEL_USER_OWNER, LEVEL_USER_EMPLOYEE,
    STATUS_ACTIVE, STATUS_INACTIVE, STATUS_BLOCK,
}                                       = require('../helper/auth.keys-constant');
const { JWT_SECRET_KEY }                = require('../../../tools/jwt/cf_jwt');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_CHATTING }           = require('../../chatting/helper/chatting.actions-constant');

// const ObjectID                      = require('mongoose').Types.ObjectId;

// const BaseModel                     = require('../intalize/base_model');
// const { isEmptyObject }             = require('../../utils/utils');

// const cfJws                         = require('../../config/cf_jws');
// const { checkObjectIDs }            = require('../../utils/utils');
// const XLSX      = require('xlsx');

// const AUTH__COMPANY_COLL                  = require('../../database/core/company-coll');
// const CONTACT_COLL                  = require('../../database/core/contact-coll');
// const DEPARTMENT_COLL               = require('../../database/core/department-coll');
// const POSITION_COLL                 = require('../../database/core/position-coll');
// const CONTRACT_COLL                 = require('../../database/core/contract-coll');
// const REMOVE_FILE_COLL              = require('../../database/core/file_removed-coll');
// const PCM_PLAN_GROUP_COLL           = require('../../database/apps/pcm/pcm_plan_group-coll');


// const DB_APP_USER_MODEL             = require('../../models/core/app_user').MODEL;
// const GROUP_OF_FRIEND_MODEL         = require('../../models/core/group_of_friend').MODEL;
// const FILE_REMOVE_MODEL             = require('../../models/core/file_removed').MODEL;

// const STRING_UTILS                  = require('../../utils/string_utils');
// const { sendMailForgetPassword, sendMailNewAccount }    = require('../../mailer/module/mail_user');
// let { socket_product }              = require('../../config/cf_mode');
// let { cachingInfoUser } = require('../../utils/caching');

/**
 * worker: (mail)
 * sử dụng WORKER_POOLS(WOKER_THREADS) thay_cho sendMailForgetPassword, sendMailNewAccount (MAIN_THREAD)
 */
// let workerpool          = require('workerpool');
// let pool                = workerpool.pool(`${__dirname}/../../workers/mail/mail.worker.js`);
// let MAIL_CONSTANTS      = require('../../workers/constants/mail');

class Model extends BaseModel {

    constructor() {
        super(require('../database/auth.user-coll'));
    }
    
    // implement by: KHANHNEY✅ 
    register({ email, fullname, level, department, position, companyID, platform }) {
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                 let emailValid      = email.toLowerCase().trim();
                 //let usernameValid   = username.toLowerCase().trim();
                 let objectExitsUser = {};

                 let listPlatformValid                    = [PLATFORM_TRIXGO, PLATFORM_WYNDIX]; 
                 let listLevelValid                       = [LEVEL_USER_OWNER, LEVEL_USER_EMPLOYEE]; 
                 /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if (!email || email == '')
                    return resolve({ error: true, message: 'mail_invalid' });

                // if (!username || username == '')
                    // return resolve({ error: true, message: 'username_invalid' });

                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'compnay_invalid' });

                if (!checkNumberIsValidWithRange({ arrValid: listPlatformValid, val: platform }))
                    return resolve({ error: true, message: 'platform_invalid' });

                if (!checkNumberIsValidWithRange({ arrValid: listLevelValid, val: level }))
                    return resolve({ error: true, message: 'level_invalid' });

                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                objectExitsUser.$or = []

                // Nếu username hay email đã tồn tại trong hệ thống thì không cho phép tạo : đảm bảo tính độc lập dữ liệu
                // if(usernameValid && usernameValid!=''){
                //     objectExitsUser.$or.push({ username : usernameValid } );
                // }

                if(email && email!=''){
                    objectExitsUser.$or.push({ email : emailValid });
                }
                
                let isExistUser = await AUTH__USER_COLL.findOne(objectExitsUser);
                // //________KIỂM TRA XEM  department, position, companyID CÓ HỢP LỆ HAY KHÔNG
                // let checkIllegal = 0;
                // if(department){
                //     let departmentInfo = await DEPARTMENT_COLL.findOne({_id: department, company: companyID});
                //     if(!departmentInfo){
                //         checkIllegal++;
                //     }
                // }
                
                // if(position){
                //     let positionInfo = await POSITION_COLL.findOne({_id: position, company: companyID});
                //     if(!positionInfo){
                //         checkIllegal++;
                //     }
                // }

                // if (Number(checkIllegal) > 0)
                //     return resolve({ error: true, message: 'Illegal data' });

                //________KIỂM TRA XEM EMAIL ĐÃ TỒN TẠI HAY CHƯA
                if (isExistUser)
                    return resolve({ error: true, message: 'email_exists_or_username_exits' });

                let password        = randomStringFixLengthCode(6);
                let hashPassword    = await hash(password, 8);
                if (!hashPassword) return resolve({ error: true, message: 'cannot_hash_password' });

                // Lấy thông tin công ty để gán ký hiệu công ty
                let infoCompany = await AUTH__COMPANY_COLL.findById(companyID);

                let dataInsert = {
                    email: emailValid,
                    password: hashPassword,
                    company: companyID,
                    platform
                }
                if(fullname) {
                    dataInsert.fullname = `${fullname}-${infoCompany.sign}`;
                    // dataInsert.fullname = `${fullname}-${infoCompany.sign}`;
                }
                // if(usernameValid) {
                //     dataInsert.username = `${usernameValid}.${infoCompany.sign}`;
                // }
                // if(department && ObjectID.isValid(department)){
                //     dataInsert.department = department;
                // }
                // if(position && ObjectID.isValid(position)){
                //     dataInsert.position = position;
                // }
                if(Number(level) == 0 || Number(level) == 1){
                    dataInsert.level = Number(level);
                }

                let infoUserAfterInsert = await this.insertData(dataInsert);
                if (!infoUserAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert_data' });

                // /*TỰ ĐỘNG KẾT BẠN CÙNG CÔNG TY*/
                // // Cho phép thành viên auto kết bạn với người cùng công ty, bao gồm cả chính tài khoản đó
                // let listUserInCompany = await AUTH__USER_COLL.find({ company: companyID });
                // let arrUserID = listUserInCompany.map(item => item._id);
                // // Update bạn bè với các thành viên của công ty
                // let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(infoUserAfterInsert._id, {
                //     friends: arrUserID,
                // }, { new: true });

                // // Update cho các thành viên công ty nhận bạn bè mới
                // for(const item of listUserInCompany){
                //     await AUTH__USER_COLL.findByIdAndUpdate(item._id, {
                //         $addToSet: {
                //             friends: infoUserAfterInsert._id
                //         }
                //     }, { new: true });
                // }

                //TODO add event gửi mail (tích hợp phần event sang service khác)
                
                // sendMailNewAccount(email, fullname, password);
                return resolve({ error: false, data: infoUserAfterInsert, pwd: password, exists: true });
            } catch (error) {
                resolve({ error: true, message: error.message });
            } 
        });
    }
    // implement by: KHANHNEY✅ 
    login({ email, password, platform }) {
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let emailValid          = email.toLowerCase().trim();
                let listPlatformValid   = [PLATFORM_TRIXGO, PLATFORM_WYNDIX]; 

                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if (!checkNumberIsValidWithRange({ arrValid: listPlatformValid, val: platform }))
                    return resolve({ error: true, message: 'platform_invalid' });

                let isExist = await AUTH__USER_COLL
                    .findOne({ email: emailValid })
                    .populate({
                        path: 'company',
                        select: '_id name sign image'
                    });

                if (!isExist)
                    return resolve({ error: true, message: 'email_not_exist' });

                const isMatchPass = await compare(password, isExist.password);
                if (!isMatchPass) return resolve({
                    error: true,
                    message: 'password_not_exist'
                });

                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                if (isExist.status == STATUS_BLOCK) 
                    return resolve({ error: true, message: 'user_blocked' });

                if (isExist.status == STATUS_INACTIVE) 
                    return resolve({ error: true, message: 'user_not_active' });
                
                // delete isExist.password;
                // delete isExist.bookmarks;
                // delete isExist.sendToFriends;
                // delete isExist.receiveFromFriends;
                // delete isExist.friends;
                // delete isExist.tags;

                let newExist = {
                    username: isExist.username,
                    email: isExist.email,
                    phone: isExist.phone,
                    name: isExist.name,
                    fullname: isExist.fullname,
                    bizfullname: isExist.bizfullname,
                    // birthDay: isExist.birthDay,
                    company: isExist.company,
                    // department: isExist.department,
                    // position: isExist.position,
                    image: isExist.image,
                    signature: isExist.signature,
                    status: isExist.status,
                    level: isExist.level,
                    // numLog: isExist.numLog,
                    // lastLogs: isExist.lastLogs,
                    // noticeConfig: isExist.noticeConfig,
                    // deviceName: isExist.deviceName,
                    // deviceID: isExist.deviceID,
                    // registrationID: isExist.registrationID,
                    _id: isExist._id,
                }

                const token = await sign({ infoUser: newExist }, JWT_SECRET_KEY);
                // update lastLog of user
                await AUTH__USER_COLL.findOneAndUpdate({ email: emailValid }, {
                    lastLog: new Date()
                });
                // Xóa những trường không cần thiết
                // delete isExist._doc.friends;
                // delete isExist._doc.password;
                // delete isExist._doc.recentlyFriends;
                // delete isExist._doc.devices;
                // delete isExist._doc.updatedAt;
                // delete isExist._doc.modifyAt;
                // delete isExist._doc.createAt;
                
                return resolve({
                    error: false,
                    data: { user: newExist, token }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    // implement by: KHANHNEY✅ 
    updateDeviceLogin({ userID, platform, deviceID, deviceName, registrationID, oneSignalID, isRemove, env }) {
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let listPlatformValid = [PLATFORM_TRIXGO, PLATFORM_WYNDIX]; 

                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if (!checkNumberIsValidWithRange({ arrValid: listPlatformValid, val: platform }))
                    return resolve({ error: true, message: 'platform_invalid' });

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'object_invalid' });

                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                let isExist = await AUTH__USER_COLL.findById(userID);
                if (!isExist)
                    return resolve({ error: true, message: 'user_not_exists' });
                
                 /**
                 * UPDATE LAST DEVICE (cập nhật device cuối cùng login)
                 * Nếu DeviceID tồn tại => cập nhật deviceName + fcm_token
                 */
                let devices     = isExist.devices;
                let newDevices  = [];

                let itemNewDevice = { deviceName, deviceID, registrationID, oneSignalID, env }
                if (devices.length) {
                    devices.forEach(device => {
                        let _device = device;
                        if (device.deviceID == itemNewDevice.deviceID) {
                            _device = {
                                deviceID        : device.deviceID, 
                                deviceName      : device.deviceName, 
                                registrationID  : registrationID,
                                oneSignalID     : oneSignalID,
                                env
                            };
                        }
                        newDevices.push(_device);
                    });

                    if (!newDevices.find(item => item.deviceID === itemNewDevice.deviceID)) 
                        newDevices.push(itemNewDevice)

                } else {  
                    newDevices = [
                        itemNewDevice
                    ]
                }

                if(isRemove) {
                    newDevices = newDevices.filter(device => 
                        device.deviceID !== itemNewDevice.deviceID &&   
                        device.deviceName !== itemNewDevice.deviceName &&   
                        device.registrationID !== itemNewDevice.registrationID &&   
                        device.oneSignalID !== itemNewDevice.oneSignalID &&   
                        device.env !== itemNewDevice.env
                    );
                }

                let infoAfterUpdateWithRegistration = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
                    devices: newDevices, 
                    modifyAt: Date.now(),
                    lastLog: Date.now()
                }, { new: true });

                return resolve({
                    error: false,
                    data: infoAfterUpdateWithRegistration
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // implement by: MINHVH ✅ 
    getListFriend({ userID, lastestID, keyword, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if(isNaN(limit)) {
					limit = 20;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

                let infoUserWithFriends = await AUTH__USER_COLL.findById(userID).select('friends');

				let conditionObj 	= { _id: { $in: infoUserWithFriends.friends } };
				let conditionFind 	= {};
				let objSort 	 	= {};
                let sortBy = {
					createAt: -1,
                    modifyAt: -1,
                }

				// GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoUser = await AUTH__USER_COLL.findById(lastestID);
                    if(!infoUser)
                        return resolve({ error: true, message: "Can't get info last user friend", status: 403 });

                    let nextInfo = `${infoUser.createAt}_${infoUser._id}`;
                    let keys 	 = ['createAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                const listFriends = await AUTH__USER_COLL
                    .find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .limit(limit + 1)
                    .sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await AUTH__USER_COLL.count(conditionObj);
				let nextCursor	= null;

				if(listFriends && listFriends.length){
					if(listFriends.length > limit){
						nextCursor = listFriends[limit - 1]._id;
						listFriends.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listFriends,
						limit,
						totalRecord,
						nextCursor
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    // implement by: MINHVH ✅ 
    getListUser({ userID, lastestID, departmentID, keyword, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(departmentID && !checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

				if(isNaN(limit)) {
					limit = 20;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				let conditionObj 	= {};
				let conditionFind 	= {};
				let objSort 	 	= {};
                let sortBy = {
                    modifyAt: -1,
					createAt: -1,
					updateAt: -1
                }

				// GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoUser = await AUTH__USER_COLL.findById(lastestID);
                    if(!infoUser)
                        return resolve({ error: true, message: "Can't get info last user", status: 403 });

                    let nextInfo = `${infoUser.createAt}_${infoUser._id}`;
                    let keys 	 = ['createAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

                departmentID && (conditionObj.department = departmentID);

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let listUsers = await AUTH__USER_COLL
                    .find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .populate('company', select.company)
                    .populate('department', select.department)
                    .limit(+limit + 1)
                    .sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await AUTH__USER_COLL.count(conditionObj);
				let nextCursor	= null;

				if(listUsers && listUsers.length){
					if(listUsers.length > limit){
						nextCursor = listUsers[limit - 1]._id;
						listUsers.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listUsers,
						limit,
						totalRecord,
						nextCursor
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * 
     * @param {*} listUserID 123,1243,2121 
     * @returns []
     */
    getListUsersForPushMobile({ users }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(users))
                    return resolve({ error: true, message: 'Request params users invalid', status: 400 });

                let userIDConvert = Array.isArray(users) ? users : [users];

                let listUsers = await AUTH__USER_COLL
                    .find({
                        _id: {
                            $in: userIDConvert
                        }
                    }, {
                        _id: 1,
                        fullname: 1,
                        devices: 1
                    })
                    .lean();

                return resolve({ 
					error: false,
					status: 200,
					data: {
						listRecords: listUsers,
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    // implement by: KHANHNEY✅ 
    getInfo({ userID, filter, select }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'userID_invalid' });
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                   /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

                let infoUser = await AUTH__USER_COLL
					.findById(userID, { ...filter, password: 0 })
					.populate('company', select.company)
					.populate('department', select.department)
					// .populate('position', select.position)
					.lean();

                return resolve({ error: false, data: infoUser });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

	// implement by: MINHVH ✅ 
	getInfoById({ userID, select }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid' });

                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
              
                let infoUser = await AUTH__USER_COLL.findById(userID)
					.select(select)
					.lean();

                return resolve({ error: false, data: infoUser });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

	// implement by: MINHVH ✅ 
	getListUserWithCondition({ condition, select, filter = {} }) {
        return new Promise(async (resolve) => {
            try {
                if(filter && typeof filter === 'string'){
                    if(!IsJsonString(filter))
                        return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

                    filter = JSON.parse(filter);
                }

				const listUsers = await AUTH__USER_COLL
					.find(condition, filter)
					.select(select)
					.lean();

                return resolve({ error: false, data: listUsers });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    resolveToken({ token }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                if(!token || token == '')
                    return resolve({ error: true, message: 'token_invalid' });
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                   /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
              
                let decoded = await verify(token, JWT_SECRET_KEY);
                if (!decoded) return resolve({ error: true, message: 'token_not_valid' });

                const { infoUser: { _id: userIDAfterDecoded } } = decoded;

                if (!userIDAfterDecoded) 
                    return resolve({ error: true, message: 'token_not_valid' });

                let infoUserDB = await AUTH__USER_COLL.findOne({ status: STATUS_ACTIVE, _id: userIDAfterDecoded });

                if (!infoUserDB) 
                    return resolve({ error: true, message: 'token_not_valid' });

                return resolve({ error: false, data: decoded });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    searchWithFullText({ fullnameKey }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                   /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                let listUsers = await AUTH__USER_COLL.find(
                    { $text: { $search: fullnameKey } },
                    { score: { $meta: "textScore" } },
                ).sort( { score: { $meta: "textScore" } } )
                .limit(10)
                .select('fullname')
                
                return resolve({ error: false, data: listUsers });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật pin cuộc hội thoại
	 * Date: 10/08/2021
	 */
	updatePinConversation({ conversationID, userID, isPin }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let infoUser = await AUTH__USER_COLL.findById(userID);
				if(!infoUser)
					return resolve({ error: true, message: "User is not exist", status: 403 });

				let infoUserAfterUpdated = null;

				if(isPin){ // Pin cuộc hội thoại

					if(infoUser.conversationsPin.includes(conversationID))
						return resolve({ error: true, message: "Conversation is pined", status: 400 });

					// Pin tối đa 5 cuộc hội thoại (pull last, push first)
					if(infoUser.conversationsPin.length >= 5){
						infoUserAfterUpdated = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
							$push: {
								conversationsPin: {
									$each: [conversationID],
									$position: 0,
									$slice: 5
								}
							}
						}, { new: true });
					} else{
						infoUserAfterUpdated = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
							$push: {
								conversationsPin: {
									$each: [conversationID],
									$position: 0
								}
							}
						}, { new: true });
					}

				} else{ // Bỏ Pin cuộc hội thoại
					infoUserAfterUpdated = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
						$pull: { conversationsPin: conversationID }
					}, { new: true });
				}

				if(!infoUserAfterUpdated)
					return resolve({ error: true, message: "Can't update pin conversation", status: 403 });

				return resolve({ error: false, data: infoUserAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Danh sách pin cuộc hội thoại
	 * Date: 06/09/2021
	 */
	getListPinConversation({ userID }) {
        return new Promise(async (resolve) => {
            try {
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				let infoUser = await AUTH__USER_COLL
					.findById(userID)
					.select('conversationsPin')
					.lean();

				if(!infoUser)
					return resolve({ error: true, message: "User is not exist", status: 403 });

                return resolve({ error: false, data: infoUser.conversationsPin, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Cập nhật pin cuộc hội thoại
	 * Date: 10/08/2021
	 */
	updatePinMedia({ mediaID, userID, isPin }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([mediaID, userID])) {
                    return resolve({ 
                        error: true, 
                        message: 'Request params mediaID or userID invalid', 
                        keyError: 'params_mediaID_or_userID_invalid',
                        status: 400 
                    });
                }

                let infoUser = await AUTH__USER_COLL.findById(userID);
				if(!infoUser)
					return resolve({ error: true, message: "User is not exist", status: 403 });

				let infoUserAfterUpdated = null;

				if(isPin){ // Pin media

					if(infoUser.mediasPin.includes(mediaID))
						return resolve({ error: true, message: "Media is pined", status: 400 });

					// Pin tối đa 5 media (pull last, push first)
					if(infoUser.mediasPin.length >= 5){
						infoUserAfterUpdated = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
							$push: {
								mediasPin: {
									$each: [mediaID],
									$position: 0,
									$slice: 5
								}
							}
						}, { new: true });
					} else{
						infoUserAfterUpdated = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
							$push: {
								mediasPin: {
									$each: [mediaID],
									$position: 0
								}
							}
						}, { new: true });
					}

				} else{ // Bỏ Pin media
					infoUserAfterUpdated = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
						$pull: { mediasPin: mediaID }
					}, { new: true });
				}

				if(!infoUserAfterUpdated)
					return resolve({ error: true, message: "Can't update pin media", status: 403 });

				return resolve({ error: false, data: infoUserAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Danh sách pin media
	 * Date: 29/12/2021
	 */
	getListPinMedia({ userID }) {
        return new Promise(async (resolve) => {
            try {
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				let infoUser = await AUTH__USER_COLL
					.findById(userID)
					.select('mediasPin')
					.lean();

				if(!infoUser)
					return resolve({ error: true, message: "User is not exist", status: 403 });

                return resolve({ error: false, data: infoUser.mediasPin || [], status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    // /**5t
    //  * Name: Cập nhật avatar
    //  * Author: Depv
    //  * update: 
    //  *  17/10/2020 -- Depv thêm xóa file cũ bằng cách thêm vào file remove
    //  *             -- Depv nếu upload thành công thì xóa file hiện tại ra khỏi file remove
    //  */
    // updateImage({ userID, image , userUpdate, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             //console.log({ userID, image , userUpdate, session });
    //             if(!ObjectID.isValid(userID) || !ObjectID.isValid(userUpdate))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //             let infoUserImageOld = await AUTH__USER_COLL.findById(userID);
    //             let { image: imageOld } = infoUserImageOld;
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 image, userUpdate, modifyAt: Date.now()
    //             }, { new: true });
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });
                
    //             await cachingInfoUser(userID, session);

    //             // Xóa ảnh củ trên S3 bằng cách push vô file-remove
    //             await FILE_REMOVE_MODEL.insert({ name: imageOld, path: `files/db/users/${imageOld}` });

    //             // pull file hiện tại ra khỏi file-remove
    //             await REMOVE_FILE_COLL.findOneAndDelete({ path: `files/db/users/${image}`});
    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }
    // /**
    //  * Name: Cập nhật chữ ký
    //  * Author: Depv
    //  * update: 
    //  *  17/10/2020 -- Depv thêm xóa file cũ bằng cách thêm vào file remove
    //  *             -- Depv nếu upload thành công thì xóa file hiện tại ra khỏi file remove
    //  */
    // updateSignature({ userID, signature , userUpdate, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //             let infoUserSignatureOld = await AUTH__USER_COLL.findById(userID);
    //             let { signature: signatureOld } = infoUserSignatureOld;

    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 signature, userUpdate, modifyAt: Date.now()
    //             }, { new: true });
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });

    //             await cachingInfoUser(userID, session);

    //             // Xóa ảnh củ trên S3 bằng cách push vô file-remove
    //             await FILE_REMOVE_MODEL.insert({ name: signatureOld, path: `files/db/users/${signatureOld}` });

    //             // pull file hiện tại ra khỏi file-remove
    //             await REMOVE_FILE_COLL.findOneAndDelete({ path: `files/db/users/${signature}`});
    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // // Recover Pass
    // checkEmailRecover({ emailRecover }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             let checkEmailRecoverExist = await AUTH__USER_COLL.findOne({ email: emailRecover });
    //             if(!checkEmailRecoverExist)
    //                 return resolve({ error: true, message: "mail_not_exist" });
    //             let codeReset = makeid(6);
    //             let infoUserAfterInsert = await AUTH__USER_COLL.findOneAndUpdate({ email: emailRecover }, {
    //                 codeReset
    //             }, { new: true });
    //             // TODO Send mail voi codeRest and email Recover
    //             return resolve({ error: false, message: "mail_exist" })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // checkCodeRecoverWithEmailRecover({ emailRecover, codeReset }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             let checkCodeRecover = await AUTH__USER_COLL.findOne({ email: emailRecover, codeReset });
    //             if(!checkCodeRecover)
    //                 return resolve({ error: true, message: "code_reset_not_match" });
    //             return resolve({ error: false, data: checkCodeRecover  });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // updateAfterForgetPassword({ email, codeReset, newPass, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //                 let hashpass = await hash(newPass, 8);
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findOneAndUpdate({ email, codeReset }, {
    //                 password: hashpass
    //             })
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });

    //             await cachingInfoUser(session, email);

    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    /**
     * Cập nhật mật khẩu
     * Depv
     * 19/08/2021
     */
    updatePassword({ userID, currentPass, newPass, session }) {
        return new Promise(async (resolve) => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "param_not_valid" });

                let { password } = await AUTH__USER_COLL.findById(userID);
                let checkCurrentPass = await compare( currentPass, password);
                if(!checkCurrentPass)
                    return resolve({ error: true, message: "current_password_faild" });
                let hashpass = await hash(newPass, 8);
                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
                    password: hashpass
                }, { new: true })
                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });
                // await cachingInfoUser(userID, session); // Hỏi lại Khánh cache chỗ này mục đích gì
                return resolve({ error: false, message: "update_password_success" });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Cập nhật họ và tên
     * Depv
     * 19/08/2021
     */
    updateFullname({ userID, firstname, lastname, fullname, ctx }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "param_not_valid", status: 400 });

                /**
                 * LOGIC STEP (3)
                 */ 
                if(firstname){
                    dataInsert.firstname = firstname;
                }

                if(lastname){
                    dataInsert.lastname = lastname;
                }

                if(fullname){
                    dataInsert.fullname = fullname;

                    let infoUser = await AUTH__USER_COLL
                        .findById(userID)
                        .select('company')
                        .populate({
                            path: "company",
                            select: "sign"
                        })
                        .lean();

                    dataInsert.bizfullname = `${fullname}-${infoUser.company.sign}`;
                }

                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, dataInsert, { new: true })
                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", status: 422 });

                if(fullname) {
                    await ctx.call(`${CF_DOMAIN_SERVICES.CHATTING}.${CF_ACTIONS_CHATTING.UPDATE_CONVERSATION_NAME_PRIVATE}`, {
                        bizfullname: dataInsert.bizfullname
                    });
                }

                return resolve({ error: false, message: "update_fullname_success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Cập nhật email
     * Depv
     * 19/08/2021
     */
    updateEmail({ userID, email }) {
        return new Promise(async (resolve) => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "param_not_valid" });
                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
                    email
                }, { new: true })
                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });
                    
                // Xóa những trường không cần thiết
                delete infoUserAfterUpdate._doc.friends;
                delete infoUserAfterUpdate._doc.password;
                delete infoUserAfterUpdate._doc.recentlyFriends;
                delete infoUserAfterUpdate._doc.devices;
                delete infoUserAfterUpdate._doc.updatedAt;
                delete infoUserAfterUpdate._doc.modifyAt;
                delete infoUserAfterUpdate._doc.createAt;
                return resolve({ error: false, data: infoUserAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }


    /**
     * Cập nhật email
     * Depv
     * 19/08/2021
     */
    updatePhone({ userID, phone }) {
        return new Promise(async (resolve) => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "param_not_valid" });
                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
                    phone
                }, { new: true })
                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });
                    
                // Xóa những trường không cần thiết
                delete infoUserAfterUpdate._doc.friends;
                delete infoUserAfterUpdate._doc.password;
                delete infoUserAfterUpdate._doc.recentlyFriends;
                delete infoUserAfterUpdate._doc.devices;
                delete infoUserAfterUpdate._doc.updatedAt;
                delete infoUserAfterUpdate._doc.modifyAt;
                delete infoUserAfterUpdate._doc.createAt;
                return resolve({ error: false, data: infoUserAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }
    /**
     * Cập nhật ngôn ngữ(lang)
     * Depv
     */
    updateLanguage({ userID, lang }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "param_not_valid" });
                /**
                 * LOGIC STEP (3)
                 */ 
                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
                    lang
                }, { new: true});

                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, message: "update_language_success" });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Cập nhật ngôn ngữ(lang)
     * Depv
     */
    updateBirthDay({ userID, birthDay }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                
                /** 
                 * VALIDATION STEP (2)
                 */
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "param_not_valid" });
                /**
                 * LOGIC STEP (3)
                 */ 
                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
                    birthDay
                }, { new: true});

                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, message: "update_birthday_success" });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Gửi code reset password
     * Depv
     */
    sendOTPResetPassword({ email }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                
                /** 
                 * VALIDATION STEP (2)
                 */
                if (!email || !email.length)
                    return res.json({ error: true, message: 'email_invalid' });
                email = email.toLowerCase().trim();
            
                /**
                 * LOGIC STEP (3)
                 * 1: Kiểm tra email có tồn tại trong hệ thống không.
                 */ 
                let checkExist = await AUTH__USER_COLL.findOne({ email });
                if (!checkExist) 
                    return resolve({ error: true, message: 'email_not_exist' });

                let codeReset  = Math.floor(100000 + Math.random() * 900000);
                console.log({ codeReset });
                let infoAfterUpdateCode = await AUTH__USER_COLL.findByIdAndUpdate(checkExist._id, { codeReset }, { new: true });
                if (!infoAfterUpdateCode) 
                    return resolve({ error: true, message: 'cannot_update_code_reset' });
                
                // await cachingInfoUser(session, email);
                // mở thread khác (worker_pool) CHƯA GỞI EMAIL
                // pool
                //     .exec(MAIL_CONSTANTS.MAIL_FORGOT_PASS, [checkExist.email, checkExist.username || checkExist.fullname || checkExist.email , codeReset])
                // sendMailForgetPassword(checkExist.email, checkExist.username || checkExist.fullname || checkExist.email , codeReset);
                return resolve({ error: false, data: 'send_email_success' });   
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * confirm code reset password
     * Depv
     */
    confirmCodeResetPassword({ email, code }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                
                /** 
                 * VALIDATION STEP (2)
                 */
                if (!email || !email.length)
                    return res.json({ error: true, message: 'email_invalid' });
                email = email.toLowerCase().trim();
            
                /**
                 * LOGIC STEP (3)
                 * 1: Kiểm tra code có tồn tại trong hệ thống không.
                 */ 
                let checkExist = await AUTH__USER_COLL.findOne({ email, codeReset: code });
                if (!checkExist) 
                    return resolve({ error: true, message: 'code_not_exist' });
                return resolve({ error: false, data: 'code_active' });   
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }
    /**
     * Cập nhật mật khẩu sau khi reset
     * Depv
     */ 
    updatePasswordAfterReset({ email, code, password }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                
                /** 
                 * VALIDATION STEP (2)
                 */
                if (!email || !email.length)
                    return res.json({ error: true, message: 'email_invalid' });
                email = email.toLowerCase().trim();
            
                /**
                 * LOGIC STEP (3)
                 */ 
                let checkExist = await AUTH__USER_COLL.findOne({ email, codeReset: code });
                if (!checkExist) 
                    return resolve({ error: true, message: 'code_not_exist' });
                // Tiến hành cập nhật mật khẩu
                let hashpass = await hash(password, 8);
                let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(checkExist._id, {
                    password: hashpass
                }, { new: true })

                if(!infoUserAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, message: "update_password_success" });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    // //_______Cấu hình hiển thị view mặc định ở trang chủ
    // updateDisplayHomeConfig({ userID, displayHomeConfig, session }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 displayHomeConfig: (!isNaN(displayHomeConfig) && [1,2].includes(Number(displayHomeConfig))) ? Number(displayHomeConfig) : 1
    //             }, { new: true})
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });

    //             await cachingInfoUser(userID, session);

    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // //_______Cấu hình giao diện chi tiết công việc
    // updateDisplayPcmConfig({ userID, displayPcmConfig, session }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 displayPcmConfig: (!isNaN(displayPcmConfig) && [1,2].includes(Number(displayPcmConfig))) ? Number(displayPcmConfig) : 1
    //             }, { new: true})
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });

    //             await cachingInfoUser(userID, session);

    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Danh sách thành viên hệ thống
    //  * Hiepnh
    //  */
    // getListMemberOfSystem({}) {
    //     return new Promise(async resolve => {
    //         try {
    //             let listUsers = await AUTH__USER_COLL.find({ })
    //                             .populate({
    //                                 path: 'company',
    //                                 select: '_id name sign'
    //                             })
    //                             .populate('tags')
    //                             .populate('department')
    //                             .populate('position')
    //                             .populate('userCreate')
    //                             .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Tìm kiếm thành viên là bạn bè của userID
    //  * Hiepnh
    //  */
    // getListMemberWithKey({ key, userID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             let infoUser = await AUTH__USER_COLL.findById(userID);
    //             let listUsers = await AUTH__USER_COLL.find({
    //                 $and: [
    //                     {status: 1},
    //                     { _id: { "$in": infoUser.friends } },
    //                     {
    //                         $or: [
    //                             { fullname: new RegExp(key, 'i') },
    //                             { email:    new RegExp(key, 'i') },
    //                         ],
    //                     },
    //                 ]
    //             })
    //             .populate({
    //                 path: 'company',
    //                 select: '_id name sign'
    //             })
    //             .populate('department')
    //             .populate('position')
    //             .populate('userCreate')
    //             .populate('userUpdate')
    //             .populate('tags')
    //             .limit(30)
    //             .sort({modifyAt: -1})
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // /**
    //  * Gửi yêu cầu kết bạn tới người khác
    //  * Hiepnh
    //  */
    // sendRequestToFriends({ userID, members, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });

    //             for (const receiveID of members){   
    //                 await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                     $addToSet: { 
    //                         sendToFriends: receiveID
    //                     }
    //                 }, { new: true });

    //                 await AUTH__USER_COLL.findByIdAndUpdate(receiveID, {
    //                     $addToSet: { 
    //                         receiveFromFriends: userID
    //                     }
    //                 }, { new: true });

    //                 await cachingInfoUser(userID, session);
    //             }

    //             return resolve({ error: false, message: 'action_finished' });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Chấp nhận kết bạn
    //  * Hiepnh
    //  */
    // acceptFriendRequest({ userID, friendID, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });

    //             // Kiểm tra xem số bạn bè đã vượt ngưỡng quy định hay chưa
    //             let infoUser = await AUTH__USER_COLL.findById(userID);
    //             if(infoUser.friends && infoUser.friends.length >= 1500){
    //                 return resolve({ error: true, message: 'Số bạn bè đã vượt quá quy định (500)' });
    //             }else{
    //                 let infoUserSendAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                     $pull: {
    //                         receiveFromFriends: friendID
    //                     },
    //                     $addToSet: {
    //                         friends: friendID
    //                     }
    //                 }, { new: true });

    //                 await cachingInfoUser(userID, session);
                   
    //                 let infoUserReceiveAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(friendID, {
    //                     $pull: {
    //                         sendToFriends: userID
    //                     },
    //                     $addToSet: {
    //                         friends: userID
    //                     }
    //                 }, { new: true });
                
    //                 if (!infoUserSendAfterUpdate || !infoUserReceiveAfterUpdate)
    //                     res.json({ error: true, message: 'cannot_accept_friend_request' });
    
    //                 return resolve({ error: false, data: infoUserSendAfterUpdate });
    //             }
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Hủy lời mời kết bạn
    //  * Hiepnh
    //  */
    // removeFriendRequest({ userID, friendID, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });

    //             let infoUserSendAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 $pull: {
    //                     receiveFromFriends: friendID
    //                 },
    //             }, { new: true });

    //             await cachingInfoUser(userID, session);
               
    //             let infoUserReceiveAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(friendID, {
    //                 $pull: {
    //                     sendToFriends: userID
    //                 },
    //             }, { new: true });

    //             // Xóa friend trong tất cả các nhóm bạn
            
    //             if (!infoUserSendAfterUpdate || !infoUserReceiveAfterUpdate)
    //                 res.json({ error: true, message: 'cannot_remove_friend_request' });

    //             return resolve({ error: false, data: infoUserSendAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Hủy bạn bè (unfriend)
    //  * Hiepnh
    //  */
    // unFriend({ userID, friendID, session }) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });

    //             let infoUserSendAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 $pull: {
    //                     friends: friendID
    //                 },
    //             }, { new: true });
                
    //             await cachingInfoUser(userID, session);
               
    //             let infoUserReceiveAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(friendID, {
    //                 $pull: {
    //                     friends: userID
    //                 },
    //             }, { new: true });

    //             // Xóa bạn bè nằm trong các group
    //             let infoAfterRemove = await GROUP_OF_FRIEND_MODEL.removeFriendInGroups({ userID, friendID });
            
    //             if (!infoUserSendAfterUpdate || !infoUserReceiveAfterUpdate)
    //                 res.json({ error: true, message: 'cannot_remove_friend_request' });

    //             return resolve({ error: false, data: infoUserSendAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Tìm kiếm bạn bè của user
    //  * Hiepnh [x]
    //  */
    // getListFriendWithKey({ userID, key }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
                    
    //             let infoUser = await AUTH__USER_COLL.findById(userID);
    //             if(!infoUser)
    //                 return resolve({ error: true, message: "cannot_get_info" });

    //             let listFriends = await AUTH__USER_COLL.find({
    //                     status: 1,
    //                     _id:   {
    //                         $in: infoUser.friends.map(item => ObjectID(item))
    //                     },
    //                     $or: [
    //                         { fullname: new RegExp(key, 'i') },
    //                         { email:    new RegExp(key, 'i') },
    //                     ]
    //                 })
    //                 .populate({
    //                     path: 'company',
    //                     select: '_id name sign'
    //                 })
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listFriends });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // /**
    //  * Name: Danh sách bạn bè
    //  * Hiepnh [x]
    //  */
    // getListMyFriend({ userID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
                    
    //             let infoUser = await AUTH__USER_COLL.findById(userID);
    //             if(!infoUser)
    //                 return resolve({ error: true, message: "cannot_get_info" });

    //             let listFriends = await AUTH__USER_COLL.find({
    //                     _id:   {
    //                         $in: infoUser.friends.map(item => ObjectID(item))
    //                     },
    //                 })
    //                 .populate({
    //                     path: 'company',
    //                     select: '_id name sign'
    //                 })
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listFriends });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // /**
    //  * Name: Danh sách bạn bè có phân trang
    //  * Author: Depv
    //  */
    // getListMyFriendWithPaging({ userID, page = 1, key }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if(!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: "param_not_valid" });
                
    //             let limit = 30;
                
    //             let infoUser = await AUTH__USER_COLL.findById(userID);
    //             if(!infoUser)
    //                 return resolve({ error: true, message: "cannot_get_info" });

    //             let conditionSearch = {};
    //             if(key){
    //                 conditionSearch.$or = [
    //                     { fullname: new RegExp(key, 'i') },
    //                     { email:    new RegExp(key, 'i') },
    //                 ]
    //             }

    //             let listFriends = await AUTH__USER_COLL.find({
    //                     _id:   {
    //                         $in: infoUser.friends.map(item => ObjectID(item))
    //                     },
    //                     ...conditionSearch
    //                 })
    //                 .populate({
    //                     path: 'company position contact',
    //                     select: '_id name sign'
    //                 })
    //                 .select('_id fullname image')
    //                 .limit(limit * 1)
    //                 .skip((page - 1) * limit);

    //             const count = await AUTH__USER_COLL.count({
    //                 _id:   {
    //                     $in: infoUser.friends.map(item => ObjectID(item))
    //                 },
    //             });

    //             return resolve({ error: false, data: listFriends, totalPages: Math.ceil(count / limit), currentPage: +page });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // autoAddAllToFriends({ userID, session }) {
    //     console.log('ok===============>>>>')
    //     return new Promise(async resolve => {
    //         try {
    //             let listUserInSystem = await AUTH__USER_COLL.find({ });
    //             let arrUserID = listUserInSystem.map(item => item._id);

    //             // Update bạn bè với các thành viên của hệ thống
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                     friends: arrUserID,
    //                     sendToFriends: [],
    //                     receiveFromFriends: [],
    //                 }, { new: true });

    //             await cachingInfoUser(userID, session);

    //             // Update cho các thành viên công ty nhận bạn bè mới
    //             for(const item of listUserInSystem){
    //                 let infoFriend = await AUTH__USER_COLL.findByIdAndUpdate(item._id, {
    //                     $addToSet: {
    //                         friends: userID
    //                     },
    //                     $pull: {
    //                         receiveFromFriends: userID,
    //                         sendToFriends: userID
    //                     },
    //                 }, { new: true });

    //                 if(!infoFriend){
    //                     console.log('error====================>>>>')
    //                 }
    //             }

    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             resolve({ error: true, message: error.message });
    //         } 
    //     });
    // }

    // autoUnfriendToAll({ userID, session }) {
    //     return new Promise(async resolve => {
    //         try {
    //             let listUserInSystem = await AUTH__USER_COLL.find({ });
    //             let arrUserID = listUserInSystem.map(item => item._id);

    //             // Update hủy bạn bè với các thành viên của hệ thống
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                     friends: [],
    //                     sendToFriends: [],
    //                     receiveFromFriends: [],
    //                 }, { new: true });

    //             await cachingInfoUser(userID, session);

    //             // Update cho các thành viên công ty hủy bạn bè với mình
    //             for(const item of listUserInSystem){
    //                 let infoFriend = await AUTH__USER_COLL.findByIdAndUpdate(item._id, {
    //                     $pull: {
    //                         friends: userID,
    //                         receiveFromFriends: userID,
    //                         sendToFriends: userID
    //                     },
    //                 }, { new: true });

    //                 if(!infoFriend){
    //                     console.log('error====================>>>>')
    //                 }
    //             }

    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             resolve({ error: true, message: error.message });
    //         } 
    //     });
    // }

    // /**
    //  * Danh sách thành viên của công ty
    //  * Hiepnh [x]
    //  */
    // getListMemberOfCompany({ companyID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(companyID))
    //                 return resolve({ error: true, message: 'param_invalid' })
    //             let listUsers = await AUTH__USER_COLL.find({ company: companyID })
    //                 .populate('company')
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    //   /**
    //  * Danh sách thành viên của công ty search theo key
    //  * Hiepnh [x]
    //  */
    // getListMemberOfCompanyByKey({ key, companyID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(companyID))
    //                 return resolve({ error: true, message: 'param_invalid' })
    //             let listUsers = await AUTH__USER_COLL.find({ 
    //                     status: 1,
    //                     company: companyID, 
    //                     $or: [
    //                         { fullname: new RegExp(key, 'i') },
    //                         { email:    new RegExp(key, 'i') },
    //                     ]
    //                 })
    //                 .populate('company')
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    //  * Danh sách các thành viên đã link với danh bạ của công ty
    //  * Hiepnh [x]
    //  */
    // getListMemberLinkToContactOfCompany({companyID}){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(companyID))
    //                 return resolve({ error: true, message: 'param_not_valid' });

    //             let listContacts = await CONTACT_COLL.aggregate([
    //                 {
    //                     $match: {
    //                         company: ObjectID(companyID),
    //                         linkUser: {$ne: null}
    //                     }
    //                 }, 
    //                 {
    //                     $group: {
    //                         _id: { user: '$linkUser' },
    //                     }
    //                 }
    //             ]).sort({"_id.user":"asc"});

    //             // if(!listUsers)
    //             //     return resolve({ error: true, message: "cannot_get_list" });

    //             let members = listContacts.map(item => ObjectID(item._id.user));

    //             let listUsers = await AUTH__USER_COLL.find({ 
    //                     _id: {$in: members},
    //                 })
    //                 .populate('company')
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    //   /**
    //  * Danh sách các thành viên đã link với danh bạ của công ty tìm kiếm theo tên
    //  * depv
    //  */
    // getListMemberLinkToContactOfCompanyByKey({ key, companyID}){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(companyID))
    //                 return resolve({ error: true, message: 'param_not_valid' });

    //             let listContacts = await CONTACT_COLL.aggregate([
    //                 {
    //                     $match: {
    //                         company: ObjectID(companyID),
    //                         linkUser: {$ne: null}
    //                     }
    //                 }, 
    //                 {
    //                     $group: {
    //                         _id: { user: '$linkUser' },
    //                     }
    //                 }
    //             ]).sort({"_id.user":"asc"});

    //             let members = listContacts.map(item => ObjectID(item._id.user));
    //             let listUsers = await AUTH__USER_COLL.find({ 
    //                     status: 1,
    //                     _id: {$in: members},
    //                     $or: [
    //                         { fullname: new RegExp(key, 'i') },
    //                         { email:    new RegExp(key, 'i') },
    //                     ]
    //                 })
    //                 .populate('company')
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    // /**
    //  * Tìm kiếm thành viên của công ty
    //  * Hiepnh [x]
    //  */
    // getListMemberOfCompanyWithKey({ companyID, key }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(companyID))
    //                 return resolve({ error: true, message: 'param_invalid' })

    //             let listUsers = await AUTH__USER_COLL.find({
    //                     status: 1,
    //                     company: companyID,
    //                     $or: [
    //                         { fullname: new RegExp(key, 'i') },
    //                         { email:    new RegExp(key, 'i') },
    //                     ]
    //                 })                    
    //                 .populate('company')
    //                 .populate('department')
    //                 .populate('position')
    //                 .populate('userCreate')
    //                 .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // getListUserNotRegisterApp({ companyID, appID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             let listAppMemberOfCompany = await DB_APP_USER_MODEL.getListMemberOfCompanyAndApp({ company: companyID, app: appID })
    //             let listAppMemberOfCompanies = [];
    //             if (listAppMemberOfCompany.data.length > 0)
    //                 listAppMemberOfCompanies = listAppMemberOfCompany.data[0].data;
                
    //             let listAppMemberOfCompaniesWithoutMetaData = listAppMemberOfCompanies.map(item => item.user._id.toString());
    //             let listAppOfCompany = await this.getListMemberOfCompany({ companyID });
    //             let { data: listMemberOfCompany } = listAppOfCompany;

    //             /**
    //              * GET LIST MEMBER OF COMPANY NOT REGISTER APP
    //              */
    //             listMemberOfCompany = listMemberOfCompany.filter(member => !listAppMemberOfCompaniesWithoutMetaData.includes(member._id.toString()));
                
    //             return resolve({ error: false, data: listMemberOfCompany })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // // -----------------------GCM-----------------------//
    // /**
    //  * FUNCTIOn được gọi sau mỗi lần user đăng nhập, xử lý bao gồm:
    //  * 1/ kiểm tra deviceID đã tồn tại, 
    //     - nếu deviceID là deviceID -> return
    //     - nếu deviceID là deviceID mới -> update thông tin device và registrationID
    //  * 2/ ko tồn tại deviceID -> cập nhật thông tin deviceID và registrationID
    //  */
    // registerNewDevice({ deviceName, deviceID, registrationID, userID, session }) {
    //     return new Promise(async resolve => {
    //         try {
    //             let isExist = await AUTH__USER_COLL.findOne({
    //                 _id: userID,
    //                 deviceID: {
    //                     $exists: true,
    //                     $ne: null
    //                 }
    //             });

    //             if (!isExist){
    //                 let infoUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                     deviceName, deviceID, registrationID, updateAt: Date.now()
    //                 }, { new: true });

    //                 await cachingInfoUser(userID, session);
    //             }

    //             else if (!Object.is(isExist.deviceID, deviceID)){
    //                 let infoUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                     deviceName, deviceID, registrationID, updateAt: Date.now()
    //                 }, { new: true });

    //                 await cachingInfoUser(userID, session);
    //             }
                
    //             if (!infoUpdate)
    //                 return resolve({ error: true, message: 'cannot_update_token_device' });
                    
    //             return resolve({ error: false, message: 'update_token_device_success' });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // removeRegistrationDevice({ userID, deviceID, session }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(userID))
    //                 return resolve({ error: true, message: 'user_id_invalid' });

                
    //             if(!deviceID) //device -> iOS || Android
    //                 return resolve({ error: true, message: 'device_id_invalid' });

    //             let infoUser =  await AUTH__USER_COLL.findById(userID);
                
    //             let devices  = infoUser.devices;

    //             let newDevices;

    //             if(devices && devices.length>0){
    //                 newDevices = [];
    //                 devices.forEach(device=>{
    //                     if(device.deviceID != deviceID){
    //                         newDevices.push(device)
    //                     }
    //                 });
                    
    //                 let infoAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, { devices : newDevices }, { new: true });
    //                 if (!infoAfterUpdate)
    //                     return resolve({ error: true, message: 'cannot_update' });

    //                 await cachingInfoUser(userID, session);

    //                 return resolve({ error: false, message: 'update_sucess' });
    //             } else
    //                 return resolve({ error: false, message: 'update_sucess' });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    // recover(email, session) {
    //     return new Promise(async resolve => {
    //         try {
    //             /**
    //              * set code (random 6 character)
    //              * => send mail with code
    //              * => enter code match => enter new password(not enter oldpass)
    //              * => redirect /login
    //              */
    //             if (!email || !email.length)
    //                 return res.json({ error: true, message: 'email_invalid' });

    //             email = email.toLowerCase().trim();

    //             let checkExist = await AUTH__USER_COLL.findOne({ email });
    //             if (!checkExist) return resolve({ error: true, message: 'email_not_exist' });

    //             // let codeReset  = STRING_UTILS.randomStringFixLengthOnlyAlphabet(6);
    //             let codeReset  = Math.floor(100000 + Math.random() * 900000);
    //             console.log({ codeReset })
    //             let infoAfterUpdateCode = await AUTH__USER_COLL.findByIdAndUpdate(checkExist._id, { codeReset: codeReset }, { new: true });

    //             if (!infoAfterUpdateCode) return resolve({ error: true, message: 'cannot_update_code_reset' });
                
    //             await cachingInfoUser(session, email);

    //             // mở thread khác (worker_pool)
    //             pool
    //                 .exec(MAIL_CONSTANTS.MAIL_FORGOT_PASS, [checkExist.email, checkExist.username || checkExist.fullname || checkExist.email , codeReset])
    //                 // sendMailForgetPassword(checkExist.email, checkExist.username || checkExist.fullname || checkExist.email , codeReset);
    //             return resolve({ error: false, data: 'send_email_success' });        
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }    

    // checkRecoverPass(email, codeReset) {
    //     return new Promise(async resolve => {
    //         try {
    //             let checkMatchExact = await AUTH__USER_COLL.findOne({
    //                 email, codeReset: codeReset
    //             });
    //             if (!checkMatchExact) return resolve({ error: true, message: 'code_not_match' });
    //             return resolve({ error: false, data: 'code_match' });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // updatePassRecover(email, password, session) {
    //     return new Promise(async resolve => {
    //         try {
    //             let isExist = await AUTH__USER_COLL.findOne({ email });
    //             if (!isExist) return resolve({ error: true, message: 'user_not_exist' });

    //             // if (isExist.codeReset != codeReset)
    //             //     return resolve({ error: true, message: 'code_invalid' });

    //             let newPassHash = await hash(password, 8);
    //             let updatePass = await AUTH__USER_COLL.findOneAndUpdate({
    //                 email
    //             }, {
    //                 password: newPassHash, codeReset: ''
    //             }, { new: true });
    //             // console.log({ updatePass })
    //             if (!updatePass) return resolve({ error: true, message: 'cannot_update_pass' });
                
    //             await cachingInfoUser(email, session);

    //             return resolve({ error: false, data: updatePass });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }   

    // updatePassRecoverForMobile(email, password, codeReset) {
    //     return new Promise(async resolve => {
    //         try {
    //             let isExist = await AUTH__USER_COLL.findOne({ email });
    //             if (!isExist) return resolve({ error: true, message: 'user_not_exist' });

    //             if (isExist.codeReset != codeReset)
    //                 return resolve({ error: true, message: 'code_invalid' });

    //             let newPassHash = await hash(password, 8);
    //             let updatePass = await AUTH__USER_COLL.findOneAndUpdate({
    //                 email, codeReset
    //             }, {
    //                 password: newPassHash, codeReset: ''
    //             }, { new: true });
    //             // console.log({ updatePass })
    //             if (!updatePass) return resolve({ error: true, message: 'cannot_update_pass' });
                
    //             await cachingInfoUser(email, session);

    //             return resolve({ error: false, data: updatePass });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }    

    // /**
    //  * FORUM APP
    //  */
    // vote({ pollingPlace, voteId, userIdIsVoted, userIdVoted }) {
    //     const COMMENT = 'comment',
    //         ANSWER = 'answer',
    //         QUESTION = 'question'
    //     return new Promise(async resolve => {
    //         try {
    //             async function saveVote(resouce) {
    //                 resouce.votes.push(userIdVoted);
    //                 (await resouce).save();
    //             }
                
    //             async function plusRepulation(id) {
    //                 const user = AUTH__USER_COLL.findById(id);
    //                 user.reputation += 100;
    //                 (await user).save();
    //                 return resolve({
    //                     error: false,
    //                     message: 'success',
    //                 })
    //             }

    //             switch (pollingPlace) {
    //                 case COMMENT: {
    //                     if(!ObjectID.isValid(voteId))
    //                         return resolve({ error: true, message: "param_not_valid" });
    //                     const comment = COMMENT_COLL.findById(voteId);
    //                     saveVote(comment);
    //                     return plusRepulation(userIdIsVoted);
    //                 }
    //                 case ANSWER: {
    //                     if(!ObjectID.isValid(voteId))
    //                         return resolve({ error: true, message: "param_not_valid" });
    //                     const answer = COMMENT_COLL.findById(voteId);
    //                     saveVote(answer);
    //                     return plusRepulation(userIdIsVoted);
    //                 }
    //                 case QUESTION: {
    //                     if(!ObjectID.isValid(voteId))
    //                         return resolve({ error: true, message: "param_not_valid" });
    //                     const question = COMMENT_COLL.findById(voteId);
    //                     saveVote(question);
    //                     return plusRepulation(userIdIsVoted);
    //                 }
                
    //                 default:
    //                     return resolve({
    //                         error: true,
    //                         message: 'failed'
    //                     })
    //             }
    //         } catch (err) {
    //             return resolve({
    //                 error: true,
    //                 message: err.message
    //             })
    //         }
    //     })
    // }

    // /**
    //  * Tìm kiếm thành viên trong dự án
    //  * Depv
    //  */
    // getListMemberInProjectByKey({ projectID, key }){
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(projectID))
    //                 return resolve({ error: true, message: 'param_invalid' })
    //             let infoProject = await DEPARTMENT_COLL.findById(projectID);

    //             let conditionObj = {
    //                 status: 1,
    //                 _id: {
    //                     $in: infoProject.members.map(item => ObjectID(item))
    //                 },
    //             }

    //             if(key){
    //                 conditionObj.$or =  [
    //                     { fullname: new RegExp(key, 'i') },
    //                     { email:    new RegExp(key, 'i') },
    //                 ]
    //             }
    //             let listUsers = await AUTH__USER_COLL.find({
    //                ...conditionObj
    //             })                    
    //             .populate('company')
    //             .populate('department')
    //             .populate('position')
    //             .populate('userCreate')
    //             .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // getListMemberInContractByKey({ projectID, key }){
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(projectID))
    //                 return resolve({ error: true, message: 'param_invalid' })
    //             let infoProject = await CONTRACT_COLL.findById(projectID);

    //             let listUsers = await AUTH__USER_COLL.find({
    //                 status: 1,
    //                 _id: {
    //                     $in: infoProject.members.map(item => ObjectID(item))
    //                 },
    //                 $or: [
    //                     { fullname: new RegExp(key, 'i') },
    //                     { email:    new RegExp(key, 'i') },
    //                 ]
    //             })                    
    //             .populate('company')
    //             .populate('department')
    //             .populate('position')
    //             .populate('userCreate')
    //             .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    //  /**
    //  * Tìm kiếm thành viên trong công ty
    //  * Depv
    //  */
    // getListMemberInCompanyByKey({ company, key }){
    //     return new Promise(async resolve => {
    //         try {
    //             if (!ObjectID.isValid(company))
    //                 return resolve({ error: true, message: 'param_invalid' })

    //             let listUsers = await AUTH__USER_COLL.find({
    //                 status: 1,
    //                 company,
    //                 $or: [
    //                     { fullname: new RegExp(key, 'i') },
    //                     { email:    new RegExp(key, 'i') },
    //                 ]
    //             })                    
    //             .populate('company')
    //             .populate('department')
    //             .populate('position')
    //             .populate('userCreate')
    //             .populate('userUpdate')
    //             return resolve({ error: false, data: listUsers })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }

    // /**
    //  * Auto kết bạn cho các thành viên cùng công ty
    //  * Author: HiepNH
    //  */
    // autoAddFriendInCompany({ companyID }){
    //     return new Promise(async resolve => {
    //         try {
    //             // Cho phép thành viên auto kết bạn với người cùng công ty, bao gồm cả chính tài khoản đó
    //             let listUserInCompany = await AUTH__USER_COLL.find({ company: companyID });
    //             let arrUserID = listUserInCompany.map(item => item._id);
    //             // console.log(arrUserID)

    //             for(const item of listUserInCompany){
    //                 await AUTH__USER_COLL.findByIdAndUpdate(item._id, {
    //                     $addToSet: {
    //                         friends: arrUserID
    //                     }
    //                 }, { new: true });
    //             }

    //             return resolve({ error: false, data: 'Successfull' })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     });
    // }
    // /**
    // * Cập nhật danh sách bạn bè liên hệ gần đây
    // * Author : Vinhnh
    // */
    // updateRecentlyFriends({ userID, friendID }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID) || !ObjectID.isValid(friendID))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //             const inforUser = await AUTH__USER_COLL.findById(userID);
    //             let recentlyFriends = inforUser.recentlyFriends;
    //             let newRecentlyFriends = [];
    //             if(inforUser.recentlyFriends){
    //                 let isPush = true;
    //                 recentlyFriends.forEach(user =>{
    //                     console.log({user, friendID})
    //                     if(user.toString() == friendID){
    //                         isPush = false
    //                     }
    //                 });
    //                 if(isPush){
    //                     if(recentlyFriends.length > 0){
    //                         if(recentlyFriends.length > 4){
    //                             let newFriends  = [friendID];
    //                             newRecentlyFriends = newFriends.concat(recentlyFriends.slice(1,5));
    //                         }else{
    //                             newRecentlyFriends = recentlyFriends;
    //                             newRecentlyFriends.push(friendID);
    //                         }
    //                     }else{
    //                         newRecentlyFriends = [friendID]
    //                     }
    //                 }else{
    //                     return resolve({ error: false, message: 'coincide_friends_id' });
    //                 }
    //             }else{
    //                 newRecentlyFriends = [friendID]
    //             }
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 recentlyFriends : newRecentlyFriends
    //             }, { new: true})
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });
    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // /**
    // * Cập nhật config group
    // * Author: Depv(30/12/2020)
    // */
    // updateConfigGroupTask({ userID, groupID }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if(!ObjectID.isValid(userID) || !ObjectID.isValid(groupID))
    //                 return resolve({ error: true, message: "param_not_valid" });
    //             let infoGroup = await PCM_PLAN_GROUP_COLL.findById(groupID);
    //             if(!infoGroup)
    //                 return resolve({ error: true, message: "param_not_exist" });
    //             let infoUserAfterUpdate = await AUTH__USER_COLL.findByIdAndUpdate(userID, {
    //                 "config.groupTask": groupID,
    //                 "config.nameGroup": infoGroup.name
    //             }, { new: true})
    //             if(!infoUserAfterUpdate)
    //                 return resolve({ error: true, message: "cannot_update" });
    //             return resolve({ error: false, data: infoUserAfterUpdate });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    /**
     * Khu vực Đệ viết theo cách mới
     */
    
    /**
     * Name: get info user ✅
     * Author: Depv
     */
    getInfoV2({ userID, select, populates, populates1, populates2, populates3 }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'param_invalid' });

                // populates
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // populates1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}
                // populates2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}
                
                // populates3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}

                let infoTask = await AUTH__USER_COLL.findById(userID)
                                .select(select)
                                .populate({
                                    path: populates?.value || "",
                                    select: populates?.select || "",
                                    populate: {
                                        path: populates1?.value ||"",
                                        select: populates1?.select || "",
                                        populate: {
                                            path: populates2?.value || "",
                                            select: populates2?.select || "",
                                            populate: {
                                                path: populates3?.value || "",
                                                select: populates3?.select || "",
                                            }
                                        }
                                    }
                                }).lean();

				if (!infoTask) return resolve({ error: true, message: 'cannot_get' });
                return resolve({ error: false, data: infoTask });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách user ✅
     * Author: Depv
     * Code  : 
     */
    getListV2({
        companyID,
        keyword, limit = 10, lastestID, filter = {}, populates= {}, populates1={}, populates2={}, populates3={}, }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                };

                let conditionFind = { };
                let sortBy   = { createAt: -1 };
				let objSort  = {};
               
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                 //__________B1: Get danh sách các nhóm dữ liệu mà userID là members
              
               
                // LẤY NHỮNG TRƯỜNG CẦN THIẾT
                if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}
				
                // POPULATE
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // POPULATE 1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}
                // POPULATE 2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}
                
                // POPULATE 3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}
               
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                if(companyID){
                    conditionObj.company = companyID
                }

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await AUTH__USER_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}

                // SEARCH TEXT
				// if(keyword){
				// 	conditionObj.$text = { $search: keyword };
				// 	objSort.score = { $meta: "textScore" };
				// 	sortBy.score  = { $meta: "textScore" };
				// }
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                
                let infoDataAfterGet = await AUTH__USER_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate({
                        path: populates?.value || "",
                        select: populates?.select || "",
                        populate: {
                            path: populates1?.value || "",
                            select: populates1?.select || "",
                            populate: {
                                path: populates2?.value || "",
                                select: populates2?.select || "",
                                populate: {
                                    path: populates3?.value || "",
                                    select: populates3?.select || "",
                                }
                            }
                        }
                    })
                    .lean(); 

                // GET TOTAL RECORD
                if(!infoDataAfterGet)
                   return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await AUTH__USER_COLL.countDocuments(conditionObj);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;