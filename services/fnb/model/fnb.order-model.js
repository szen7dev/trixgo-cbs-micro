"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, validateParamsObjectID }
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const moment = require("moment");

/**s
 * import inter-coll, exter-coll
 */
const ITEM__FUNDA_COLL            			   = require('../../item/database/item.funda-coll'); 
const ITEM__CONTACT_COLL            		   = require('../../item/database/item.contact-coll'); 
const FNB_ORDER_COLL                           = require('../database/fnb.order-coll');
const FNB_PRODUCT_COLL                         = require('../database/fnb.product-coll');
const FNB_ORDER_PRODUCT_COLL                   = require('../database/fnb.order_product-coll');
const FNB_SHIFT_COLL                           = require('../database/fnb.shift-coll');
const FNB_MISTAKE_COLL                         = require('../database/fnb.mistake-coll');
const FNB_QUOTA_COLL                           = require('../database/fnb.quota-coll');
const FNB_ORDER_MATERIAL_COLL                  = require('../database/fnb.order_material-coll');
const FNB_GENERAL_BOOK_COLL                    = require('../database/fnb.general_book-coll');

/**
 * import inter-model, exter-model
 */
const FNB_ORDER_PRODUCT_MODEL                  = require('./fnb.order_product-model').MODEL;

class Model extends BaseModel {

    constructor() {
        super(FNB_ORDER_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ fundaID, parentID, customerID, shiftID, name, appOrderSign, note, salesChannel, paymentMethod, service, total, discount, salesoff, vatAmount, products, userID }) {
        // console.log({ fundaID, parentID, customerID, shiftID, name, appOrderSign, note, salesChannel, paymentMethod, service, total, discount, salesoff, vatAmount, products, userID })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Bước 1: Khởi tạo đơn hàng
                 * - Cập nhật thuộc tính của Cơ sở
                 * - Cập nhật thuộc tính của Ca làm việc
                 * - Cập nhật thuộc tính của khách hàng
                 * Bước 2: Thêm sản phẩm vào đơn hàng => cập nhật giá đơn hàng
                 * Bước 3: Tính triết khấu, giảm giá => cập nhật giá đơn hàng
                 * Bước 4: Khởi tạo nguyên liệu sử dụng cho đơn hàng
                 * Bước 5: Cập nhật thông số của đơn hàng ngược lại vào:
                 * - Cơ sở
                 * - Ca làm việc
                 * - Khách hàng
                 */
                if(!checkObjectIDs(fundaID) || !checkObjectIDs(customerID) || !checkObjectIDs(shiftID) || !name)
                    return resolve({ error: true, message: 'companyID|fundaID|name invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                // Thông tin cơ sở
                let infoFunda = await ITEM__FUNDA_COLL.findById(fundaID)
                if (!infoFunda)
                    return resolve({ error: true, message: 'cannot_get_infoFunda' });
                    
                // Thông tin ca làm việc
                let infoShift = await FNB_SHIFT_COLL.findById(shiftID)
                if (!infoShift)
                    return resolve({ error: true, message: 'cannot_get_infoShift' });

                // Thông tin khách hàng
                let infoCustomer = await ITEM__CONTACT_COLL.findById(customerID)
                if (!infoCustomer)
                    return resolve({ error: true, message: 'cannot_get_infoCustomer' });

                // Lấy số đơn hàng khách đã mua
                let numberOD = await FNB_ORDER_COLL.count({customer: customerID})
                // console.log({numberOD})

                /**
                 * Tính mã hóa đơn tự động theo hệ thống (từ 1->N)
                 */
                let numberOfOrder = await FNB_ORDER_COLL.count({})

                let dataInsert = {
                    company: infoFunda.company,
                    funda: fundaID,
                    customer: customerID,
                    shift: shiftID,
                    name,
                    sign: `C${Number(numberOfOrder+1)}`,
                    amount: 0,
                    userCreate: userID
                };

                /**
                 * B1. CẬP NHẬT THUỘC TÍNH CỦA CƠ SỞ
                 */
                // Thuộc chiến dịch marketing hay không
                if(infoFunda.campaign){
                    dataInsert.campaign = infoFunda.campaign
                }

                // Thong hoặc ngoài hệ thống
                if(infoFunda.internal){
                    dataInsert.internal = infoFunda.internal
                }

                // Khu vực
                if(infoFunda.area3){
                    dataInsert.area1 = infoFunda.area1
                    dataInsert.area2 = infoFunda.area2
                    dataInsert.area3 = infoFunda.area3
                }

                // Chiến dịch
                if(infoFunda.campaignName && checkObjectIDs(infoFunda.campaignName)){
                    dataInsert.campaignName = infoFunda.campaignName
                }

                /**
                 * B2. CẬP NHẬT THUỘC TÍNH CỦA CA LÀM VIỆC
                 */
                // Mùa trong năm
                if(infoShift.seasons){
                    dataInsert.seasons = Number(infoShift.seasons);
                }

                // Phân loại ca sáng, chiều, tối, đêm
                if(infoShift.shiftType){
                    dataInsert.shiftType = Number(infoShift.shiftType);
                }

                // Nhân viên thực hiện
                if(infoShift.staffs && infoShift.staffs.length){
                    dataInsert.assignee = infoShift.staffs;

                    // Doanh số trung bình/đầu nhân viên (nhiều nhân viên)
                    dataInsert.avgTotalPerStaff = Number(total/Number(infoShift.staffs.length)).toFixed(0)
                }else{
                    dataInsert.assignee = [userID];

                    // Doanh số trung bình/đầu nhân viên (1 nhân viên)
                    dataInsert.avgTotalPerStaff = Number(total);
                }

                /**
                 * B3. CẬP NHẬT THUỘC TÍNH CỦA KHÁCH HÀNG
                 */
                // Giới tính
                if(infoCustomer.gender && !isNaN(infoCustomer.gender)){
                    dataInsert.gender = Number(infoCustomer.gender);
                }

                // Độ tuổi
                if(infoCustomer.birthday){
                    let dateNow = new Date
                    dataInsert.age = Number(dateNow.getFullYear()) - Number(infoCustomer.birthday.getFullYear())
                }

                // Khách vãng lai hay không
                if(infoCustomer.nonResident && !isNaN(infoCustomer.nonResident)){
                    dataInsert.nonResident = Number(infoCustomer.nonResident);
                }

                /**
                 * KHÁC
                 */
                if(numberOD && numberOD > 0){
                    dataInsert.new = 2 // Đơn hàng khách cũ
                }else{
                    dataInsert.new = 1 // Đơn hàng khách mới
                }

                if(appOrderSign && appOrderSign != ""){
                    dataInsert.appOrderSign = appOrderSign;
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(parentID && checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(!isNaN(salesChannel) && [1,2,3,4,5,6].includes(Number(salesChannel))){
                    dataInsert.salesChannel = Number(salesChannel);
                }

                if(!isNaN(paymentMethod)&& [1,2].includes(Number(paymentMethod))){
                    dataInsert.paymentMethod = Number(paymentMethod);
                }

                if(!isNaN(service)&& [1,2,3].includes(Number(service))){
                    dataInsert.service = Number(service);
                }

                // Tính tổng khối lượng sản phẩm (cốc)
                let totalQuantity = 0;
                if(products && products.length){
                    for (let item of products) {
                        totalQuantity = Number(totalQuantity) + Number(item.quantity);
                    }

                    dataInsert.numberOfProducts = Number(totalQuantity)

                    // Số lượng sản phẩm trung bình của mỗi nhân viên
                    dataInsert.avgQuantityPerStaff = Number(totalQuantity/Number(infoShift.staffs.length)).toFixed(2)
                }

                /**
                 * TÍNH TOÁN GIÁ TRỊ
                 */
                let loyaltyPoints = 0, amount = 0

                if(!isNaN(total)){
                    dataInsert.total = Number(total);
                    amount = Number(total)
                }

                if(!isNaN(discount)){
                    dataInsert.discount = Number(discount)

                    amount = Number(amount) - Number(discount)
                }

                if(!isNaN(salesoff)){
                    dataInsert.salesoff = Number(salesoff)

                    amount = Number(amount) - Number(salesoff)

                    // Chính sách tích điểm
                    loyaltyPoints = Number(Number(total-discount-salesoff)*(5/100)).toFixed(0) // Tích điểm 5%
                    dataInsert.loyaltyPoints = Number(loyaltyPoints)
                }

                dataInsert.amount = Number(amount)

                if(!isNaN(vatAmount)){
                    dataInsert.vatAmount = Number(vatAmount)
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED });

                /**
                 * GÁN SẢN PHẨM VÀO ORDER
                 */
                const orderID = infoAfterInsert._id;

                if(products && products.length){
                    const productsAsync = products.map(product => {
                        const dataInsertProduct = {
                            userID,
                            orderID,
                            productID: product.productID,
                            size: product.size ? Number(product.size) : 1,
                            sugar: product.sugar ? Number(product.sugar) : 1,
                            ice: product.ice ? Number(product.ice) : 1,
                            subProductsID: product.variantsID,
                            quantity: product.quantity ? Number(product.quantity) : 0,
                            unitPrice: product.unitPrice,
                            note: product.note
                        }
                        return FNB_ORDER_PRODUCT_MODEL.insert(dataInsertProduct);
                    })

                    await Promise.all(productsAsync);
                }

                /**
                 * CẬP NHẬT GIÁ TRỊ ĐƠN HÀNG SAU KHI CHỌN XONG SẢN PHẨM
                 * - Bỏ phần này đi, vì đã được tính ở Client rồi
                 * - Nếu sử dụng hàm này -> cần tính thêm cả giá thành của Topping nữa (subProductsID)
                 */

                /**
                 * BẮN SOCKET VÀ CLOUD MSS
                 * -> Gửi tới các user là members của fundaID (infoFunda.members)
                 * -> Thực hiện ở phía Client side
                 */

                /**
                 * B5. CẬP NHẬT THÔNG TIN ĐƠN HÀNG VÀO:
                 * - Cơ sở
                 * - Ca làm việc
                 * - Khách hàng
                 */
                let dataUpdateFw = {}

                if(!isNaN(salesChannel) && Number(salesChannel) === 1){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders1": 1, 
                        "total1": Number(total), 
                    }
                }
                if(!isNaN(salesChannel) && Number(salesChannel) === 2){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders2": 1, 
                        "total2": Number(total), 
                    }
                }
                if(!isNaN(salesChannel) && Number(salesChannel) === 3){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders3": 1, 
                        "total3": Number(total), 
                    }
                }
                if(!isNaN(salesChannel) && Number(salesChannel) === 4){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders4": 1, 
                        "total4": Number(total), 
                    }
                }
                if(!isNaN(salesChannel) && Number(salesChannel) === 5){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders5": 1, 
                        "total5": Number(total), 
                    }
                }
                if(!isNaN(salesChannel) && Number(salesChannel) === 6){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders6": 1, 
                        "total6": Number(total), 
                    }
                }
                if(!isNaN(salesChannel) && Number(salesChannel) === 7){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders7": 1, 
                        "total7": Number(total), 
                    }
                }

                // Tiền mặt
                if(!isNaN(paymentMethod) && Number(paymentMethod) === 1){
                    dataUpdateFw.$inc.cashAmount = Number(amount)
                }

                if(!isNaN(paymentMethod) && Number(paymentMethod) === 2){
                    dataUpdateFw.$inc.transferAmount = Number(amount)
                }
                // console.log(dataUpdateFw)
                
                /**
                 * Cập nhật vào Cơ sở
                 * - Số lượng đơn hàng
                 * - Doanh số
                 * - Doanh thu sau khi trừ giảm giá, triết khấu
                 * - Số lượng đơn Off, App (các loại app) và giá trị đơn hàng
                 * - Số lượng sản phẩm (để kiểm kê cốc)
                 * - Tiền mặt, chuyển khoản
                 */
                await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, dataUpdateFw)

                /**
                 * Cập nhật vào Ca làm việc
                 * - Số lượng đơn hàng
                 * - Doanh số
                 * - Doanh thu sau khi trừ giảm giá, triết khấu
                 * - Số lượng đơn Off, App (các loại app) và giá trị đơn hàng
                 * - Số lượng sản phẩm (để kiểm kê cốc)
                 * - Tiền mặt, chuyển khoản
                 */
                await FNB_SHIFT_COLL.findByIdAndUpdate(shiftID, dataUpdateFw)

                /**
                 * Cập nhật vào Khách hàng
                 * - Khách hàng mới hay cũ
                 * - Doanh số
                 * - Điểm tích lũy (tăng, giảm)
                 * - Số đơn hàng
                 */
                if(numberOD && numberOD > 0){
                    await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, {
                        new: 2, // Khách hàng cũ
                        $inc: { 
                            "numberOfOrders": 1,
                            "purchasedValue": Number(amount),
                            "totalLoyaltyPoints": Number(loyaltyPoints),
                        }
                    })
                }else{
                    await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, {
                        $inc: { 
                            "numberOfOrders": 1,
                            "purchasedValue": Number(amount),
                            "totalLoyaltyPoints": Number(loyaltyPoints),
                        }
                    })
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 24/11/2022
     */
    update({ orderID, userID,
        customerID, status }) {
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * - Nếu cập nhật Đơn hàng sang trạng thái hủy: status = 5 (Hoàn thành) -> 4 (Hủy)
                 * => Xóa định mức hao phí (fnb_order_material)
                 * => Cập nhật status cho order_product
                 * => Cập nhật khối lượng giao ca...
                 * ***CẬP NHẬT LẠI MÃ KHÁCH
                 * => Cập nhật lại thông tin của đơn hàng vào Khách mới => Xóa thông tin ở Khách cũ
                 */
                if(!checkObjectIDs(orderID))
                    return resolve({ error: true, message: 'orderID invalid', keyError: KEY_ERROR.PARAMS_INVALID })
                
                let infoOrder = await FNB_ORDER_COLL.findById(orderID)
                if(!infoOrder)
                    return resolve({ error: true, message: 'orderID invalid', keyError: KEY_ERROR.PARAMS_INVALID })

                let oldCustomerID = infoOrder.customer;

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                /**
                 * 1-Cập nhật mã khách mới vào đơn hàng
                 * 2-Cập nhật mã khách mới vào đơn hàng, sản phẩm
                 * 3-Cập nhật doanh số vào Khách cũ
                 * 4-Cập nhật doanh số vào Khách mới
                 */
                if(customerID && checkObjectIDs(customerID)){
                    let infoCustomer = await ITEM__CONTACT_COLL.findById(customerID)
                    if(!infoCustomer)
                        return resolve({ error: true, message: 'customerID invalid', keyError: KEY_ERROR.PARAMS_INVALID })
                        
                    dataInUpdate.customer = customerID
                    dataInUpdate.name = `Đơn hàng ${infoCustomer.name}`

                    // Giới tính
                    if(infoCustomer.gender && !isNaN(infoCustomer.gender)){
                        dataInUpdate.gender = Number(infoCustomer.gender);
                    }

                    // Độ tuổi
                    if(infoCustomer.birthday){
                        let dateNow = new Date
                        dataInUpdate.age = Number(dateNow.getFullYear()) - Number(infoCustomer.birthday.getFullYear())
                    }

                    // Khách vãng lai hay không
                    if(infoCustomer.nonResident && !isNaN(infoCustomer.nonResident)){
                        dataInUpdate.nonResident = Number(infoCustomer.nonResident);
                    }
                }

                if(!isNaN(status)){
                    dataInUpdate.status = Number(status);
                }

                // console.log(dataInUpdate)

                let infoAfterUpdate = await FNB_ORDER_COLL.findByIdAndUpdate(orderID, dataInUpdate, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED })

                if(customerID && checkObjectIDs(customerID)){

                    // 2-Cập nhật mã khách mới vào đơn hàng, sản phẩm
                    await FNB_ORDER_PRODUCT_COLL.updateMany(
                        {
                            order: ObjectID(orderID),
                            // customer: ObjectID(oldCustomerID),
                        },
                        {$set: {customer: customerID } }
                     )

                    /**
                     * 3-Cập nhật doanh số vào Khách cũ
                     */
                    // Lấy số đơn hàng khách đã mua
                    // let numberOD = await FNB_ORDER_COLL.count({customer: customerID})
                    // if(numberOD && numberOD > 0){
                    //     await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, {
                    //         new: 2, // Khách hàng cũ
                    //         $inc: { 
                    //             "numberOfOrders": 1,
                    //             "purchasedValue": Number(amount),
                    //             "totalLoyaltyPoints": Number(loyaltyPoints),
                    //         }
                    //     })
                    // }else{
                    //     await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, {
                    //         $inc: { 
                    //             "numberOfOrders": 1,
                    //             "purchasedValue": Number(amount),
                    //             "totalLoyaltyPoints": Number(loyaltyPoints),
                    //         }
                    //     })
                    // }
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: Update value
     * Author: HiepNH
     * Code: 24/11/2022
     */
    updateValue({ orderID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderID))
                    return resolve({ error: true, message: 'orderID invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let infoOrder = await FNB_ORDER_COLL.findById(orderID)

                let total = infoOrder.total;
                let discount = infoOrder.discount;
                let salesoff = infoOrder.salesoff;
                let amount = infoOrder.amount;

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() };

                let listData = await FNB_ORDER_PRODUCT_COLL.aggregate([
                    {
                        $match: {
                            order: ObjectID(orderID)
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            amount: { $sum: "$amount" },
                        }
                    }
                ])

                if(listData && listData.length){
                    total = Number(listData[0].amount)
                    amount = Number(total)-Number(discount)-Number(salesoff)

                    dataInUpdate.total = Number(total)
                    dataInUpdate.amount = Number(amount)
                }

                let infoAfterUpdate = await FNB_ORDER_COLL.findByIdAndUpdate(orderID, dataInUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }


    /**
     * Name: Remove
     * Author: HiepNH
     * Code: 24/11/2022
     */

    /**
     * Name: Get info
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getInfo({ orderID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderID))
                    return resolve({ error: true, message: 'param_invalid' });

                // populate
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                let infoPlanGroup = await FNB_ORDER_COLL.findById(orderID)
                                    .select(select)
                                    .populate(populates)

                if (!infoPlanGroup) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: infoPlanGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name  : Get list
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getList({ companyID, fundasID, shiftTypes, salesChannels, services, statuss, isMistake, fromDate, toDate, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        // console.log({ fundasID, shiftTypes, salesChannels, services, statuss, isMistake, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: ObjectID(companyID) }
                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

                const validation = validateParamsObjectID({
                    fundasID            : { value: fundasID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

                // Gom nhóm theo đơn vị cơ sở
                if(fundasID && fundasID.length ){
                    console.log('==============Chọn đơn vị cơ sở')
                    let arrFun = fundasID.map(item=>ObjectID(item))

                    if(arrFun.length) {
                        conditionObj.funda = { $in: arrFun };
                    }
                }else{
                    console.log('==============Không chọn đơn vị cơ sở')
                    let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}});
                    // console.log(listFundaIsMember)

                    let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                    if(fundasIDIsMember.length) {
                        conditionObj.funda = { $in: fundasIDIsMember };
                    }
                }

                shiftTypes && shiftTypes.length             && (conditionObj.shiftType = { $in: shiftTypes });
                salesChannels && salesChannels.length       && (conditionObj.salesChannel = { $in: salesChannels });
                services && services.length                 && (conditionObj.service = { $in: services });
                statuss && statuss.length                   && (conditionObj.status = { $in: statuss });

                // Phân loại có lỗi hay không
                if(isMistake && isMistake == 1){
                    conditionObj.numberOfMistakes = { $gt: 0 }
                }

                // Phân loại theo thời khoảng
                if(fromDate && toDate){
                    conditionObj.createAt = {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    }
                }

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }
                // console.log('==================TÌM KIẾM ĐƠN HÀNG===================')
                // console.log(conditionObj)

                /**
                 * ĐIỀU KIỆN KHÁC
                 */
                if(populates && typeof populates === 'string'){
                    if(!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request params select invalid', status: 400 });

                    select = JSON.parse(select);
                }

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await FNB_ORDER_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FNB_ORDER_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await FNB_ORDER_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getListByProperty({ companyID, fundasID, option, optionGroup, optionTime, year, fromDate, toDate, userID }) {
        // console.log({ companyID, fundasID, option, optionGroup, optionTime, year, fromDate, toDate, userID })
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    // Danh sách
                }else{
                    let conditionObj = { company: ObjectID(companyID) }
                    let conditionGroup = {}
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"total": -1}

                    /**
                     * VALIDATION (1)
                     */
                    const validation = validateParamsObjectID({
                        fundasID            : { value: fundasID, isRequire: false },
                    });
                    if(validation.error) return resolve(validation);

                    // Gom nhóm theo đơn vị cơ sở
                    if(fundasID && fundasID.length ){
                        console.log('============111111111111111111111111')
                        let arrFun = fundasID.map(item=>ObjectID(item))
                        conditionObj.funda = { $in: arrFun }
                    }else{
                        console.log('============222222222222222222222222')
                        let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}})
                        // conditionObj.funda = { $in: listFundaIsMember.map(item=>ObjectID(item._id)) }

                        let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                        if(fundasIDIsMember.length) {
                            conditionObj.funda = { $in: fundasIDIsMember };
                        }
                    }

                    // Phân loại theo thời khoảng
                    if(fromDate && toDate){
                        conditionObj.createAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                            // $gte: moment(fromDate).startOf('day')._d,
                            // $lte: moment(toDate).endOf('day')._d,
                        }
                    }

                    /**
                     * Gom nhóm theo Phân loại căn bản
                     */
                    if(option && Number(option) == 1){
                        conditionGroup = {
                            _id: { new: "$new", shiftType: "$shiftType", internal: "$internal", salesChannel: "$salesChannel", paymentMethod: "$paymentMethod" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }
                    }

                    /**
                     * Gom nhóm theo Thời gian
                     * - Số lượng đơn hàng
                     * - Giá trị đơn hàng
                     * - Số lượng sản phẩm
                     */
                    if(option && Number(option) == 2){
                        // Theo năm
                        if(optionTime && Number(optionTime) == 1){
                            conditionGroup = {
                                _id: { year: "$year" },
                                quantity: { $sum: 1 },
                                total: { $sum: "$total" },
                                discount: { $sum: "$discount" },
                                salesoff: { $sum: "$salesoff" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }

                        // Theo tháng trong năm
                        if(optionTime && Number(optionTime) == 2){
                            if(!isNaN(year) && Number(year) >= 0){
                                conditionObjYear = {
                                    "year": Number(year),
                                }
                            }

                            conditionGroup = {
                                _id: { month: "$month", year: "$year" },
                                quantity: { $sum: 1 },
                                total: { $sum: "$total" },
                                discount: { $sum: "$discount" },
                                salesoff: { $sum: "$salesoff" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }

                        // Theo giờ trong ngày (trả về kết quả +7 giờ => bằng giờ trong DB)
                        if(optionTime && Number(optionTime) == 3){
                            conditionGroup = {
                                _id: { hour: "$hour" },
                                quantity: { $sum: 1 },
                                total: { $sum: "$total" },
                                discount: { $sum: "$discount" },
                                salesoff: { $sum: "$salesoff" },
                                amount: { $sum: "$amount" },
                                vatAmount: { $sum: "$vatAmount" },
                                numberOfProducts: { $sum: "$numberOfProducts" },
                            }
                        }
                    }

                    /**
                     * Gom nhóm theo Đơn vị cơ sở
                     */
                    if(option && Number(option) == 3){
                        conditionGroup = {
                            _id: { funda: "$funda" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }

                        conditionPopulate = {
                            path: '_id.funda',
                            select: '_id name sign image',
                            model: 'funda'
                        }
                    }

                    /**
                     * Gom nhóm theo Khách hàng
                     */
                    if(option && Number(option) == 4){
                        conditionGroup = {
                            _id: { customer: "$customer" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }
                    }

                    /**
                     * Gom nhóm theo Nhân viên phục vụ
                     */
                    if(option && Number(option) == 5){
                        conditionObj.assignee = {$in: [ObjectID(userID)]}
                        conditionGroup = {
                            _id: { },
                            avgQuantityPerStaff: { $sum: "$avgQuantityPerStaff" },
                            avgTotalPerStaff: { $sum: "$avgTotalPerStaff" },
                        }
                    }

                    // console.log(conditionObj)
                    // console.log(conditionGroup)

                    // Danh sách đang triển khai
                    let listData = await FNB_ORDER_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$createAt"},
                                month : {$month : "$createAt"},
                                hour : {$hour : "$createAt"},
                                funda : 1,
                                customer : 1,
                                new : 1,
                                assignee : 1,
                                campaign : 1,
                                activeCampaign : 1,
                                internal : 1,
                                area1 : 1,
                                area2 : 1,
                                area3 : 1,
                                shift : 1,
                                shiftType : 1,
                                seasons : 1,
                                salesChannel : 1,
                                paymentMethod : 1,
                                service : 1,
                                status : 1,
                                numberOfMistakes : 1,
                                numberOfProducts : 1,
                                total : 1,
                                salesoff : 1,
                                discount : 1,
                                amount : 1,
                                vatAmount : 1,
                                avgQuantityPerStaff : 1,
                                avgTotalPerStaff : 1,
                                gender : 1,
                                age : 1,
                                loyaltyPoints : 1,
                            }
                        },
                        {
                            $match: conditionObjYear
                        },
                        {
                            $group: conditionGroup
                        },
                        {
                            $sort: sortBy
                        }
                    ])
                    if(!isNaN(option) && [3].includes(Number(option))){
                        await FNB_ORDER_COLL.populate(listData, conditionPopulate)
                    }

                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Reset data
     * Author: HiepNH
     * Code: 25/12/2022
     */
    resetAllData({ option, email, password, userID, companyID }) {
        // console.log({ option, email, password, userID, companyID })
        return new Promise(async (resolve) => {
            try {
                if(password.toString() != `noPass12345${email}`)
                    return resolve({ error: true, message: 'Mật hiệu không chính xác', status: 403 })

                if(option == 1){
                    await ITEM__CONTACT_COLL.deleteMany({ company: companyID })
                }

                if(option == 2){
                    await FNB_PRODUCT_COLL.deleteMany({ company: companyID })
                }

                if(option == 3){
                    await FNB_ORDER_COLL.deleteMany({ company: companyID })
                    await FNB_ORDER_PRODUCT_COLL.deleteMany({ company: companyID })
                }

                if(option == 4){
                    await FNB_SHIFT_COLL.deleteMany({ company: companyID })
                }

                if(option == 5){
                    await FNB_MISTAKE_COLL.deleteMany({ company: companyID })
                }

                if(option == 6){
                    await FNB_QUOTA_COLL.deleteMany({ company: companyID })
                }

                if(option == 7){
                    await FNB_ORDER_MATERIAL_COLL.deleteMany({ company: companyID })
                }

                if(option == 8){
                    await FNB_GENERAL_BOOK_COLL.deleteMany({ company: companyID })
                }

                if(option == 9){
                    await ITEM__CONTACT_COLL.deleteMany({ company: companyID })
                    await FNB_PRODUCT_COLL.deleteMany({ company: companyID })
                    await FNB_ORDER_COLL.deleteMany({ company: companyID })
                    await FNB_ORDER_PRODUCT_COLL.deleteMany({ company: companyID })
                    await FNB_SHIFT_COLL.deleteMany({ company: companyID })
                    await FNB_MISTAKE_COLL.deleteMany({ company: companyID })
                    await FNB_QUOTA_COLL.deleteMany({ company: companyID })
                    await FNB_ORDER_MATERIAL_COLL.deleteMany({ company: companyID })
                    await FNB_GENERAL_BOOK_COLL.deleteMany({ company: companyID })
                }
                
                if(option == 10){
                    await FNB_PRODUCT_COLL.updateMany({ company: companyID }, {$set: {"images": []}})
                }

                return resolve({ error: false, message: 'Reset thành công'});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;