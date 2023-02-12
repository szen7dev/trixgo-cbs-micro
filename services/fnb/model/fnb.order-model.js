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
const USER_COLL                                = require('../../auth/database/auth.user-coll');
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

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

const { 
    FNB_FACTOR,
    FNB_NEW,
    FNB_NON_RESIDENT,
    FNB_INTERNAL,
    FNB_SHIFT_TYPES,
    FNB_SEASONS,
    FNB_SALES_CHANNEL,
    FNB_PAYMENT_METHOD,
    FNB_SERVICE,
    FNB_STATUS
 } = require('../helper/fnb.keys-constant');
class Model extends BaseModel {

    constructor() {
        super(FNB_ORDER_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ fundaID, parentID, customerID, shiftID, name, appOrderSign, note, salesChannel, paymentMethod, service, total, discount, salesoff, credit, vatAmount, products, userID }) {
        // console.log({ fundaID, parentID, customerID, shiftID, name, appOrderSign, note, salesChannel, paymentMethod, service, total, discount, salesoff, credit, vatAmount, products, userID })
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
                // console.log(infoFunda)
                    
                // Thông tin ca làm việc
                let infoShift = await FNB_SHIFT_COLL.findById(shiftID)
                if (!infoShift)
                    return resolve({ error: true, message: 'cannot_get_infoShift' });

                // Thông tin khách hàng
                let infoCustomer = await ITEM__CONTACT_COLL.findById(customerID)
                if (!infoCustomer)
                    return resolve({ error: true, message: 'cannot_get_infoCustomer' })

                // Lấy số đơn hàng khách đã mua
                let numberOD = await FNB_ORDER_COLL.count({customer: customerID})
                // console.log({numberOD})

                /**
                 * Tính mã hóa đơn tự động theo hệ thống (từ 1->N)
                 */
                let numberOfOrder = await FNB_ORDER_COLL.count({ company: infoFunda.company })

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

                // Doanh số khách cũ, mới
                // if(numberOD && numberOD > 0){
                if((numberOD && numberOD > 0) || (infoCustomer.new && infoCustomer.new == 2)){
                    dataInsert.new = 2 // Đơn hàng khách cũ
                }else{
                    dataInsert.new = 1 // Đơn hàng khách mới
                }

                // Khách vãng lai hay không
                if(infoCustomer.nonResident && !isNaN(infoCustomer.nonResident)){
                    dataInsert.nonResident = Number(infoCustomer.nonResident);

                    // Khách vãng lai
                    if(infoCustomer.nonResident == 2){
                        dataInsert.new = 3 // Khách vãng lai
                    }
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

                if(!isNaN(paymentMethod)&& [1,2].includes(Number(paymentMethod))){
                    dataInsert.paymentMethod = Number(paymentMethod);
                }

                if(!isNaN(salesChannel) && [1,2,3,4,5,6,7].includes(Number(salesChannel))){
                    dataInsert.salesChannel = Number(salesChannel);

                    if(salesChannel != 1){
                        dataInsert.paymentMethod = Number(2) // Chuyển khoản
                    }
                }

                if(!isNaN(service)&& [1,2,3].includes(Number(service))){
                    dataInsert.service = Number(service);

                    // Kênh offline
                    if(Number(service) === 1){
                        // console.log('YYYYYYYYYYY>>>>>>>>>>>>>>>>>>>>>>')
                        dataInsert.salesChannel = Number(1)
                    }
                }
                // console.log('==============>>>>>>>>>>>>>>>>>>>>>>')
                // console.log(dataInsert)

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

                /**
                 * TÍCH ĐIỂM NẾU LÀ ĐƠN OFF VÀ KHÔNG CÓ GIẢM GIÁ
                 */
                if(salesChannel == 1){
                    // Nếu có giảm giá
                    if(!isNaN(salesoff) && Number(salesoff) > 0){
                        // Nếu đã giảm giá thì không được tích điểm
                        dataInsert.salesoff = Number(salesoff)
                        amount = Number(amount) - Number(salesoff)
                    }
                    
                    // Nếu không có giảm giá
                    else{
                        // Nếu có tích điểm
                        if(!isNaN(credit)){
                            dataInsert.credit = Number(credit)
                            amount = Number(amount) - Number(credit)
                        }

                        /**
                         * Chính sách tích điểm => Mở chính thức vào 1/3/2023
                         */
                        let factor = 0
                        if(Number(infoCustomer.purchasedValue) < Number(FNB_FACTOR.credit.level2.purchasedValue)){
                            factor = Number(FNB_FACTOR.credit.level1.factor)
                        }else{
                            if(Number(infoCustomer.purchasedValue) < Number(FNB_FACTOR.credit.level3.purchasedValue)){
                                factor = Number(FNB_FACTOR.credit.level2.factor)
                            }else{
                                if(Number(infoCustomer.purchasedValue) < Number(FNB_FACTOR.credit.level4.purchasedValue)){
                                    factor = Number(FNB_FACTOR.credit.level3.factor)
                                }else{
                                    factor = Number(FNB_FACTOR.credit.level4.factor)
                                }
                            }
                        }
                        // console.log({factor})

                        loyaltyPoints = Number(Number(amount)*(Number(factor/100))).toFixed(0)

                        dataInsert.loyaltyPoints = Number(loyaltyPoints)
                    }
                }

                dataInsert.amount = Number(amount)

                if(!isNaN(vatAmount)){
                    // console.log('55555555555555555')
                    dataInsert.vatAmount = Number(vatAmount)
                }else{
                    // console.log('66666666666666666666666')
                    // console.log( Number(FNB_FACTOR.vatRate))
                    // console.log( Number(FNB_FACTOR.vatRate/100))
                    dataInsert.vatAmount = Number(amount*Number(FNB_FACTOR.vatRate/100)/(Number(1 + Number(FNB_FACTOR.vatRate/100)))).toFixed(0)
                }

                /**
                 * NHÂN VIÊN THỰC HIỆN
                 */
                let numberStaff = 0
                if(infoShift.staffs && infoShift.staffs.length){
                    numberStaff = infoShift.staffs.length
                    let arrStaffs = infoShift.staffs

                    if(infoShift.subStaffs && infoShift.subStaffs.length){
                        arrStaffs = [...arrStaffs,...infoShift.subStaffs]

                        numberStaff = Number(numberStaff) + Number(infoShift.subStaffs.length)
                    }

                    // Nhân viên thực hiện
                    dataInsert.assignee = arrStaffs;

                    // Doanh số trung bình/đầu nhân viên (nhiều nhân viên)
                    if(Number(numberStaff) != 0){
                        dataInsert.avgTotalPerStaff = Number(amount/Number(numberStaff)).toFixed(0)
                    }else{
                        dataInsert.avgTotalPerStaff = 1
                    }
                }else{
                    numberStaff = 1
                    dataInsert.assignee = [userID];

                    // Doanh số trung bình/đầu nhân viên (1 nhân viên)
                    dataInsert.avgTotalPerStaff = Number(amount/Number(numberStaff)).toFixed(0)
                }
                // console.log({numberStaff})
                // console.log(Number(amount/Number(numberStaff)).toFixed(0))

                /**
                 * KHỐI LƯỢNG SẢN PHẨM
                 */
                let totalQuantity = 0;
                if(products && products.length){
                    for (let item of products) {
                        totalQuantity = Number(totalQuantity) + Number(item.quantity);
                    }

                    dataInsert.numberOfProducts = Number(totalQuantity)

                    // Số lượng sản phẩm trung bình của mỗi nhân viên
                    dataInsert.avgQuantityPerStaff = Number(totalQuantity/Number(numberStaff)).toFixed(2)
                }

                /**
                 * THÊM SIZE VÀO ĐƠN HÀNG VÀ CA LÀM VIỆC
                 */
                let totalSizeM = 0, totalSizeL = 0
                // console.log('=============1: SẢN PHẨM GIỎ HÀNG==========================>>>>>>>>>>>>>>>>>')
                if(products && products.length){
                    for(const prodSize of products){
                        // console.log('=============1.1: Bắt đầu SP==========================>>>>>>>>>>>>>>>>>')
                        // console.log(prodSize)
                        if(prodSize.size == 1){
                            totalSizeM = Number(totalSizeM) + Number(prodSize.quantity)
                        }
                        if(prodSize.size == 2){
                            totalSizeL = Number(totalSizeL) + Number(prodSize.quantity)
                        }
                        // console.log('=============1.2: Kết thúc SP==========================>>>>>>>>>>>>>>>>>')
                    }
                }
                // console.log('=============2: SẢN PHẨM GIỎ HÀNG==========================>>>>>>>>>>>>>>>>>')

                dataInsert.numberOfSizeM = Number(totalSizeM)
                dataInsert.numberOfSizeL = Number(totalSizeL)
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert);
                // console.log(infoAfterInsert)
                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Thêm thất bại', keyError: KEY_ERROR.INSERT_FAILED });

                /**
                 * GÁN SẢN PHẨM VÀO ĐƠN HÀNG-SẢN PHẨM
                 */
                const orderID = infoAfterInsert._id;
                if(products && products.length){
                    // Thêm vào đơn hàng-sản phẩm
                    const productsAsync = products.map(product => {

                        // Tính giá sản phẩm trong trường hợp có cả Topping
                        let newUnitPrice = product.unitPrice
                        // console.log('============Gía 11111111111111111111')
                        // console.log({newUnitPrice})

                        if(product.variantsSelected && product.variantsSelected.length){
                            for(const subProd of product.variantsSelected){
                                // console.log({subProd})
                                // M-Off
                                if(Number(product.size) == 1 && Number(salesChannel) == 1){
                                    newUnitPrice = Number(newUnitPrice) + subProd.unitPrice
                                }

                                // M-App
                                if(Number(product.size) == 1 && Number(salesChannel) != 1){
                                    newUnitPrice = Number(newUnitPrice) + subProd.unitPrice2
                                }

                                // L-Off
                                if(Number(product.size) == 2 && Number(salesChannel) == 1){
                                    newUnitPrice = Number(newUnitPrice) + subProd.unitPrice3
                                }

                                // L-App
                                if(Number(product.size) == 2 && Number(salesChannel) != 1){
                                    newUnitPrice = Number(newUnitPrice) + subProd.unitPrice4
                                }
                            }
                        }
                        // console.log('============Gía 2222222222222222222')
                        // console.log({newUnitPrice})

                        const dataInsertProduct = {
                            userID,
                            orderID,
                            productID: product.productID,
                            size: product.size ? Number(product.size) : 1,
                            sugar: product.sugar ? Number(product.sugar) : 1,
                            ice: product.ice ? Number(product.ice) : 1,
                            subProductsID: product.variantsID,
                            quantity: product.quantity ? Number(product.quantity) : 0,
                            unitPrice: newUnitPrice,
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
                 * B5. CẬP NHẬT THÔNG TIN SAU KHI TẠO XONG ĐƠN HÀNG:
                 * - Cơ sở
                 * - Ca làm việc
                 * - Khách hàng
                 */
                let dataUpdateFw = {}

                // Kênh bán hàng, size, doanh số và số sản phẩm
                if(!isNaN(salesChannel) && Number(salesChannel) === 1){
                    dataUpdateFw.$inc = { 
                        "total": Number(total), 
                        "amount": Number(amount),
                        "numberOfProducts": totalQuantity, 
                        "numberOfOrders": 1, 
                        "numberOfOrders1": 1, 
                        "total1": Number(total), 
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
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
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
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
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
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
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
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
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
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
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
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
                        "numberOfSizeM": Number(totalSizeM), 
                        "numberOfSizeL": Number(totalSizeL), 
                    }
                }

                // Tiền mặt và chuyển khoản
                if(!isNaN(paymentMethod) && Number(paymentMethod) === 1){
                    dataUpdateFw.$inc.cashAmount = Number(amount)
                }

                if(!isNaN(paymentMethod) && Number(paymentMethod) === 2){
                    dataUpdateFw.$inc.transferAmount = Number(amount)
                }

                // console.log(dataUpdateFw)
                
                /**
                 * CẬP NHẬT VÀO ĐIỂM BÁN/CƠ SỞ
                 * - Số lượng đơn hàng
                 * - Doanh số
                 * - Doanh thu sau khi trừ giảm giá, triết khấu
                 * - Số lượng đơn Off, App (các loại app) và giá trị đơn hàng
                 * - Số lượng sản phẩm (để kiểm kê cốc)
                 * - Tiền mặt, chuyển khoản
                 */
                await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, dataUpdateFw)

                /**
                 * CẬP NHẬT VÀO CA LÀM VIỆC
                 * - Số lượng đơn hàng
                 * - Doanh số
                 * - Doanh thu sau khi trừ giảm giá, triết khấu
                 * - Số lượng đơn Off, App (các loại app) và giá trị đơn hàng
                 * - Số lượng sản phẩm (để kiểm kê cốc)
                 * - Tiền mặt, chuyển khoản
                 */
                await FNB_SHIFT_COLL.findByIdAndUpdate(shiftID, dataUpdateFw)

                /**
                 * CẬP NHẬT VÀO KHÁCH HÀNG
                 * - Khách hàng mới hay cũ
                 * - Doanh số
                 * - Điểm tích lũy (tăng, giảm)
                 * - Số đơn hàng
                 */
                // console.log(infoCustomer)
                let oldNumberOfOrders = infoCustomer.numberOfOrders | 0
                let oldPurchasedValue = infoCustomer.purchasedValue | 0
                // let oldTotalLoyaltyPoints = infoCustomer.totalLoyaltyPoints | 0
                // let oldUsedLoyaltyPoints = infoCustomer.usedLoyaltyPoints | 0
                // let oldRemainLoyaltyPoints = infoCustomer.remainLoyaltyPoints | 0

                let newNumberOfOrders = Number(oldNumberOfOrders) + Number(1)
                let newPurchasedValue = Number(oldPurchasedValue) + Number(amount)
                // let newTotalLoyaltyPoints = Number(oldTotalLoyaltyPoints) + Number(loyaltyPoints)
                // let newUsedLoyaltyPoints = Number(oldUsedLoyaltyPoints) + Number(credit | 0)
                // let newRemainLoyaltyPoints = Number(newTotalLoyaltyPoints) - Number(newUsedLoyaltyPoints)
                // console.log({newRemainLoyaltyPoints})

                if(numberOD && numberOD > 0){
                    await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, {
                        new: 2, // Khách hàng cũ
                        numberOfOrders: Number(newNumberOfOrders),
                        purchasedValue: Number(newPurchasedValue),
                        // totalLoyaltyPoints: Number(newTotalLoyaltyPoints),
                        // usedLoyaltyPoints: Number(newUsedLoyaltyPoints),
                        // remainLoyaltyPoints: Number(newRemainLoyaltyPoints),
                    })
                }else{
                    await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, {
                        numberOfOrders: Number(newNumberOfOrders),
                        purchasedValue: Number(newPurchasedValue),
                        // totalLoyaltyPoints: Number(newTotalLoyaltyPoints),
                        // usedLoyaltyPoints: Number(newUsedLoyaltyPoints),
                        // remainLoyaltyPoints: Number(newRemainLoyaltyPoints),
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
        customerID, cancelNote, filesID, status, paymentMethod, salesChannel }) {
        const that = this
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * 1-CẬP NHẬT ĐƠN HÀNG: 
                 * - Hủy đơn
                 * - Phương thức thanh toán
                 * - Kênh bán hàng => Đồng thời cập nhật Phương thức thanh toán
                 * - Gán lỗi
                 * 2.1-CẬP NHẬT THÔNG TIN NGƯỢC LẠI VÀO CA LÀM VIỆC
                 * 2.2-CẬP NHẬT THÔNG TIN NGƯỢC LẠI VÀO ĐƠN VỊ CƠ SỞ
                 * 2.3-CẬP NHẬT THÔNG TIN NGƯỢC LẠI VÀO KHÁCH HÀNG (CŨ, MỚI)
                 */
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

                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() }

                if(cancelNote) {
                    dataInUpdate.note = cancelNote;
                }

                if(checkObjectIDs(filesID)) {
                    dataInUpdate.$addToSet = { files: filesID };
                }

                /**
                 * CẬP NHẬT TRẠNG THÁI-HỦY ĐƠN
                 */
                if(!isNaN(status)){
                    dataInUpdate.status = Number(status);
                }
            
                /**
                 * CẬP NHẬT PHƯƠNG THỨC THANH TOÁN
                 * 1-Cập nhật đơn hàng
                 * 2-Cập nhật vào ca làm việc
                 */
                if(!isNaN(paymentMethod)){
                    dataInUpdate.paymentMethod = Number(paymentMethod) //=> Bỏ đi vì chỉ cần cập nhật kênh bán hàng là OK
                }

                /**
                 * CẬP NHẬT KÊNH BÁN HÀNG
                 * 1-Cập nhật đơn hàng
                 * 2-Cập nhật vào ca làm việc
                 * 3-Cập nhật vào Điểm bán (Cơ sở)
                 */
                if(!isNaN(salesChannel)){
                    dataInUpdate.salesChannel = Number(salesChannel)

                    // Nếu cập nhật từ Off sang App
                    if(salesChannel != 1){
                        dataInUpdate.paymentMethod = Number(2) // Chuyển khoản
                    }
                }

                /**
                 * CẬP NHẬT KHÁCH HÀNG
                 * 1-Cập nhật mã khách mới vào đơn hàng
                 * 2-Cập nhật mã khách mới vào đơn hàng, sản phẩm
                 * 3-Cập nhật doanh số vào Khách cũ
                 * 4-Cập nhật doanh số vào Khách mới
                 */
                if(customerID && checkObjectIDs(customerID)){
                    let infoCustomer = await ITEM__CONTACT_COLL.findById(customerID)
                    if(!infoCustomer)
                        return resolve({ error: true, message: 'customerID invalid', keyError: KEY_ERROR.PARAMS_INVALID })

                    // Tên đơn hàng
                    dataInUpdate.name = `Đơn hàng ${infoCustomer.name}-${infoCustomer.phone}`

                    // Mã khách
                    dataInUpdate.customer = customerID

                    // Giới tính
                    if(infoCustomer.gender && !isNaN(infoCustomer.gender)){
                        dataInUpdate.gender = Number(infoCustomer.gender);
                    }

                    // Độ tuổi
                    if(infoCustomer.birthday){
                        let dateNow = new Date
                        dataInUpdate.age = Number(dateNow.getFullYear()) - Number(infoCustomer.birthday.getFullYear())
                    }

                    // Doanh số khách cũ, mới
                    let numberOD = await FNB_ORDER_COLL.count({customer: customerID})
                    if((numberOD && numberOD > 0) || (infoCustomer.new && infoCustomer.new == 2)){
                        dataInUpdate.new = 2 // Đơn hàng khách cũ
                    }else{
                        dataInUpdate.new = 1 // Đơn hàng khách mới
                    }

                    // Khách vãng lai hay không
                    if(infoCustomer.nonResident && !isNaN(infoCustomer.nonResident)){
                        dataInUpdate.nonResident = Number(infoCustomer.nonResident);

                        // Khách vãng lai
                        if(infoCustomer.nonResident == 2){
                            dataInUpdate.new = 3 // Khách vãng lai
                        }
                    }
                }

                let infoAfterUpdate = await FNB_ORDER_COLL.findByIdAndUpdate(orderID, dataInUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED })

                /**
                 * CẬP NHẬT VÀO CÁC COLL LIÊN QUAN
                 */
                // 1. Cập nhật vào ca làm việc
                await that.updateShift({ shiftID: infoOrder.shift, userID })

                // 2. Cập nhật vào đơn vị cơ sở

                // 3. Cập nhật vào khách hàng: MỚI VÀ CŨ
                if(customerID && checkObjectIDs(customerID)){
                    await that.updateCustomer({ customerID, userID }) 
                    await that.updateCustomer({ customerID: oldCustomerID, userID }) 

                    // Cập nhật đơn hàng, sản phẩm
                    await FNB_ORDER_PRODUCT_COLL.updateMany(
                        {
                            order: ObjectID(orderID),
                        },
                        {$set: {customer: customerID } }
                     )
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
     * Name: Update value
     * Author: HiepNH
     * Code: 24/11/2022
     */
    updateShift({ shiftID, option, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(shiftID))
                    return resolve({ error: true, message: 'shiftID invalid', keyError: KEY_ERROR.PARAMS_INVALID })
                
                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() }

                let numberOfOrders = 0
                let numberOfCancelOrders = 0
                let totalOfCancelOrders = 0
                let numberOfMistakes = 0
                let amountOfMistakes = 0
                let cashAmount = 0
                let transferAmount = 0
                let numberOfSizeM = 0
                let numberOfSizeL = 0
                let numberOfOrders1 = 0
                let numberOfOrders2 = 0
                let numberOfOrders3 = 0
                let numberOfOrders4 = 0
                let numberOfOrders5 = 0
                let numberOfOrders6 = 0
                let numberOfOrders7 = 0
                let total = 0
                let total1 = 0
                let total2 = 0
                let total3 = 0
                let total4 = 0
                let total5 = 0
                let total6 = 0
                let total7 = 0

                // Tổng hợp thông tin từ các đơn hàng: Đơn HOÀN THÀNH
                let listData = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: {
                            shift: ObjectID(shiftID)
                        }
                    },
                    {
                        $group: {
                            _id: { salesChannel: "$salesChannel", paymentMethod: "$paymentMethod", status: "$status" },
                            quantity: { $sum: 1 },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                        }
                    }
                ])
                // console.log(listData)

                if(listData && listData.length){
                    for(const item of listData){
                        // console.log(item)
                        /**
                         * ĐƠN HOÀN THÀNH
                         */
                        if(item._id.status && item._id.status == 5){
                            // console.log('---------------------->>>>>>>>>>>>>>>>>>')
                            numberOfOrders = Number(numberOfOrders) + Number(item.quantity)

                            // Tiền mặt và chuyển khoản
                            if(item._id.paymentMethod && item._id.paymentMethod == 1){
                                // console.log('==========TIỀN MẶT============')
                                cashAmount = Number(cashAmount) + Number(item.amount)

                                console.log({cashAmount})
                            }else{
                                // console.log('==========CHUYỂN KHOẢN============')
                                transferAmount = Number(transferAmount) + Number(item.amount)
                            }

                            // Kênh bán hàng
                            if(item._id.salesChannel){
                                total = Number(total) + Number(item.total)

                                if(item._id.salesChannel && item._id.salesChannel == 1){
                                    numberOfOrders1 = Number(numberOfOrders1) + Number(item.quantity)
                                    total1 = Number(total1) + Number(item.total)
                                }

                                if(item._id.salesChannel && item._id.salesChannel == 2){
                                    numberOfOrders2 = Number(numberOfOrders2) + Number(item.quantity)
                                    total2 = Number(total2) + Number(item.total)
                                }

                                if(item._id.salesChannel && item._id.salesChannel == 3){
                                    numberOfOrders3 = Number(numberOfOrders3) + Number(item.quantity)
                                    total3 = Number(total3) + Number(item.total)
                                }

                                if(item._id.salesChannel && item._id.salesChannel == 4){
                                    numberOfOrders4 = Number(numberOfOrders4) + Number(item.quantity)
                                    total4 = Number(total4) + Number(item.total)
                                }

                                if(item._id.salesChannel && item._id.salesChannel == 5){
                                    numberOfOrders5 = Number(numberOfOrders5) + Number(item.quantity)
                                    total5 = Number(total5) + Number(item.total)
                                }

                                if(item._id.salesChannel && item._id.salesChannel == 6){
                                    numberOfOrders6 = Number(numberOfOrders6) + Number(item.quantity)
                                    total6 = Number(total6) + Number(item.total)
                                }

                                if(item._id.salesChannel && item._id.salesChannel == 7){
                                    numberOfOrders7 = Number(numberOfOrders7) + Number(item.quantity)
                                    total7 = Number(total7) + Number(item.total)
                                }
                            }
                        }

                        /**
                         * ĐƠN HỦY
                         */
                        if(item._id.status && item._id.status == 4){
                            numberOfCancelOrders = Number(numberOfCancelOrders) + Number(item.quantity)
                            totalOfCancelOrders = Number(totalOfCancelOrders) + Number(item.total)
                        }
                    }
                }

                /**
                 * SỐ LƯỢNG SIZE M, L
                 */
                // Danh sách các đơn hàng hoàn thành
                let listOrders = await FNB_ORDER_COLL.find({ shift: shiftID, status: 5 })
                let listData1 = await FNB_ORDER_PRODUCT_COLL.aggregate([
                    {
                        $match: {
                            order: {$in: listOrders.map(item => ObjectID(item._id))},
                            shift: ObjectID(shiftID)
                        }
                    },
                    {
                        $group: {
                            _id: { size: "$size" },
                            quantity: { $sum: "$quantity" },
                            // quantity: { $sum: 1 },
                        }
                    }
                ])
                // console.log(listData1)
                if(listData1 && listData1.length){
                    for(const item of listData1){
                        if(item._id.size && item._id.size == 1){
                            numberOfSizeM = Number(numberOfSizeM) + Number(item.quantity)
                        }else{
                            numberOfSizeL = Number(numberOfSizeL) + Number(item.quantity)
                        }
                    }
                }

                dataInUpdate.numberOfOrders = Number(numberOfOrders)
                dataInUpdate.numberOfCancelOrders = Number(numberOfCancelOrders)
                dataInUpdate.totalOfCancelOrders = Number(totalOfCancelOrders)
                dataInUpdate.numberOfSizeM = Number(numberOfSizeM)
                dataInUpdate.numberOfSizeL = Number(numberOfSizeL)
                dataInUpdate.cashAmount = Number(cashAmount)
                dataInUpdate.transferAmount = Number(transferAmount)
                dataInUpdate.numberOfOrders1 = Number(numberOfOrders1)
                dataInUpdate.numberOfOrders2 = Number(numberOfOrders2)
                dataInUpdate.numberOfOrders3 = Number(numberOfOrders3)
                dataInUpdate.numberOfOrders4 = Number(numberOfOrders4)
                dataInUpdate.numberOfOrders5 = Number(numberOfOrders5)
                dataInUpdate.numberOfOrders6 = Number(numberOfOrders6)
                dataInUpdate.numberOfOrders7 = Number(numberOfOrders7)
                dataInUpdate.total = Number(total)
                dataInUpdate.total1 = Number(total1)
                dataInUpdate.total2 = Number(total2)
                dataInUpdate.total3 = Number(total3)
                dataInUpdate.total4 = Number(total4)
                dataInUpdate.total5 = Number(total5)
                dataInUpdate.total6 = Number(total6)
                dataInUpdate.total7 = Number(total7)                
                
                // console.log(dataInUpdate)

                let infoAfterUpdate = await FNB_SHIFT_COLL.findByIdAndUpdate(shiftID, dataInUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED });

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
    updateCustomer({ customerID, option, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(customerID))
                    return resolve({ error: true, message: 'customerID invalid', keyError: KEY_ERROR.PARAMS_INVALID })
                
                let dataInUpdate = { userUpdate: userID, modifyAt: new Date() }

                let numberOfOrders = 0
                let purchasedValue = 0
                let totalLoyaltyPoints = 0
                // let usedLoyaltyPoints = 0
                // let remainLoyaltyPoints = 0 // Tính theo totalLoyaltyPoints-usedLoyaltyPoints
                let numberOfCancelOrders = 0
                let totalOfCancelOrders = 0

                // Tổng hợp thông tin từ các đơn hàng
                let listData = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: {
                            customer: ObjectID(customerID)
                        }
                    },
                    {
                        $group: {
                            _id: { status: "$status" },
                            quantity: { $sum: 1 },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$amount" },
                            loyaltyPoints: { $sum: "$amount" },
                        }
                    }
                ])
                // console.log(listData)

                if(listData && listData.length){
                    for(const item of listData){
                        /**
                         * ĐƠN HOÀN THÀNH
                         */
                        if(item._id.status && item._id.status == 5){
                            numberOfOrders = Number(numberOfOrders) + Number(item.quantity)
                            purchasedValue = Number(purchasedValue) + Number(item.amount)
                            totalLoyaltyPoints = Number(totalLoyaltyPoints) + Number(item.loyaltyPoints)
                        }

                        /**
                         * ĐƠN HỦY
                         */
                        if(item._id.status && item._id.status == 4){
                            numberOfCancelOrders = Number(numberOfCancelOrders) + Number(item.quantity)
                            totalOfCancelOrders = Number(totalOfCancelOrders) + Number(item.total)
                        }
                    }
                }

                dataInUpdate.numberOfOrders = Number(numberOfOrders)
                dataInUpdate.purchasedValue = Number(purchasedValue)
                dataInUpdate.totalLoyaltyPoints = Number(totalLoyaltyPoints)
                dataInUpdate.numberOfCancelOrders = Number(numberOfCancelOrders)
                dataInUpdate.totalOfCancelOrders = Number(totalOfCancelOrders)

                // console.log(dataInUpdate)

                let infoAfterUpdate = await ITEM__CONTACT_COLL.findByIdAndUpdate(customerID, dataInUpdate, { new: true });
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
    getList({ companyID, fundasID, shiftsID, assigneesID, shiftTypes, salesChannels, services, statuss, isMistake, fromDate, toDate, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) {
        // console.log({ fundasID, shiftsID, shiftTypes, salesChannels, services, statuss, isMistake, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID })
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
                    }else{
                        // Cần bổ sung điều kiện khi user không có cơ sở nào => data phải rỗng
                        conditionObj.funda = { $in: [] };
                    }
                }

                shiftsID && shiftsID.length                 && (conditionObj.shift = { $in: shiftsID });
                assigneesID && assigneesID.length           && (conditionObj.assignee = { $in: assigneesID });
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
    getListByProperty({ companyID, fundasID, option, optionGroup, optionStatus, optionTime, year, fromDate, toDate, userID }) {
        // console.log({ companyID, fundasID, option, optionGroup, optionStatus, optionTime, year, fromDate, toDate, userID})
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
                        let arrFun = fundasID.map(item=>ObjectID(item))
                        conditionObj.funda = { $in: arrFun }
                    }else{
                        let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}})

                        let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                        if(fundasIDIsMember.length) {
                            conditionObj.funda = { $in: fundasIDIsMember };
                        }
                    }

                    /**
                     * Phân loại theo trạng thái đơn hàng
                     * - Xử lý tình huống tạm thời
                     */
                    if(!optionStatus){
                        // conditionObj.status = { $in: [1,2,3,5] };
                        conditionObj.status = Number(5)
                    }else{
                        // Đơn hủy
                        conditionObj.status = Number(4)
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

                    /**
                     * Gom nhóm theo Khu vực
                     */
                    if(option && Number(option) == 6){
                        conditionGroup = {
                            _id: { area: "$area1" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                        }

                        conditionPopulate = {
                            path: '_id.area',
                            select: '_id name sign',
                            model: 'area'
                        }
                    }

                    /**
                     * Gom nhóm theo Người tạo đơn
                     */
                    if(option && Number(option) == 7){
                        conditionGroup = {
                            _id: { assignee: "$assignee._id" },
                            quantity: { $sum: 1 },
                            total: { $sum: "$total" },
                            discount: { $sum: "$discount" },
                            salesoff: { $sum: "$salesoff" },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            numberOfProducts: { $sum: "$numberOfProducts" },
                            avgQuantityPerStaff: { $sum: "$avgQuantityPerStaff" },
                            avgTotalPerStaff: { $sum: "$avgTotalPerStaff" },
                        }

                        conditionPopulate = {
                            path: '_id.assignee',
                            select: '_id fullname',
                            model: 'user'
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

                    if(option && Number(option) == 7){
                        listData = await FNB_ORDER_COLL.aggregate([
                            {
                                $match: conditionObj
                            },
                            {
                                $project : {
                                    year : {$year : "$createAt"},
                                    month : {$month : "$createAt"},
                                    day: { $dayOfMonth: "$createAt" },
                                    company : 1,
                                    funda : 1,
                                    createAt: 1,
                                    assignee : 1,
                                    executor: 1,
                                    total: 1,
                                    discount: 1,
                                    salesoff: 1,
                                    amount: 1,
                                    vatAmount: 1,
                                    numberOfProducts: 1,
                                    avgTotalPerStaff: 1,
                                    avgQuantityPerStaff: 1
                                }
                            },
                            {
                                $match: conditionObjYear
                            },
                            { 
                                $lookup: {
                                    from: "users",
                                    localField: "assignee",
                                    foreignField: "_id",
                                    as: "assignee"
                                }  
                            },
                            {
                                $unwind: "$assignee"
                            },
                            {
                                $group: conditionGroup
                            },
                            {
                                $sort: sortBy
                            }
                        ])
                    }

                    if(!isNaN(option) && [3,6,7].includes(Number(option))){
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
     * Dev: HiepNH
     * Func: Tải KPI
     * Date: 8/12/2022
     */
    exportExcel({ companyID, year, month, userID }) {
        // console.log({ companyID, year, month, userID })
        return new Promise(async resolve => {
            try {
                let yearFilter
                let currentYear = new Date().getFullYear()
                if(year && !isNaN(year)){
                    yearFilter = Number(year)
                }else{
                    yearFilter = Number(currentYear)
                }

                let conditionObj = { 
                    company: ObjectID(companyID),
                    status: 5,
                    avgTotalPerStaff: {$exists: true, $ne: null},
                    avgQuantityPerStaff: {$exists: true, $ne: null},
                }
                let projectObj =  {
                    year : {$year : "$createAt"},
                    month : {$month : "$createAt"},
                    day: { $dayOfMonth: "$createAt" },
                    company : 1,
                    funda : 1,
                    createAt: 1,
                    assignee : 1,
                    executor: 1,
                    total: 1,
                    amount: 1,
                    avgTotalPerStaff: 1,
                    avgQuantityPerStaff: 1
                }
                let lookupObj = {
                    from: "users",
                    localField: "assignee",
                    foreignField: "_id",
                    as: "staff"
                } 
                let conditionGroup = {}
                let conditionPopulate = {}, sortBy = {"avgQuantityPerStaff": -1}

                let conditionObjYear = {
                    "year": Number(yearFilter),
                }

                let conditionObjYear1 = {
                    "year": Number(yearFilter),
                    "month": Number(1),
                }
                let conditionObjYear2 = {
                    "year": Number(yearFilter),
                    "month": Number(2),
                }
                let  conditionObjYear3 = {
                    "year": Number(yearFilter),
                    "month": Number(3),
                }
                let conditionObjYear4 = {
                    "year": Number(yearFilter),
                    "month": Number(4),
                }
                let conditionObjYear5 = {
                    "year": Number(yearFilter),
                    "month": Number(5),
                }
                let conditionObjYear6 = {
                    "year": Number(yearFilter),
                    "month": Number(6),
                }
                let conditionObjYear7 = {
                    "year": Number(yearFilter),
                    "month": Number(7),
                }
                let conditionObjYear8 = {
                    "year": Number(yearFilter),
                    "month": Number(8),
                }
                let  conditionObjYear9 = {
                    "year": Number(yearFilter),
                    "month": Number(9),
                }
                let conditionObjYear10 = {
                    "year": Number(yearFilter),
                    "month": Number(10),
                }
                let conditionObjYear11 = {
                    "year": Number(yearFilter),
                    "month": Number(11),
                }
                let conditionObjYear12 = {
                    "year": Number(yearFilter),
                    "month": Number(12),
                }

                conditionGroup = {
                    // _id: {  staff: "$staff._id", month: "$month", year: "$year" },
                    _id: {  staff: "$staff._id" },
                    number: { $sum: 1 },
                    avgTotalPerStaff: { $sum: "$avgTotalPerStaff" },
                    avgQuantityPerStaff: { $sum: "$avgQuantityPerStaff" },
                }

                conditionPopulate = {
                    path: '_id.staff',
                    select: '_id fullname department',
                    populate: {
                        path: 'department',
                        select: '_id name',
                        model: 'department',
                    },
                    model: 'user'
                }

                /**
                 * DANH BẠ ĐIỂM BÁN
                 */
                let conditionGroupContact = {
                    _id: {  funda: "$funda", month: "$month" },
                    number: { $sum: 1 },
                }
                let listDataFunda = await ITEM__FUNDA_COLL.find({company: ObjectID(companyID)}).select('_id name')
                let listDataContact = await ITEM__CONTACT_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                        }
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear
                    },
                    {
                        $group: conditionGroupContact
                    }
                ])
                // console.log(listDataContact)

                /**
                 * LỖI MẮC PHẢI
                 */
                let conditionGroupErr = {
                    _id: {  executor: "$executor", month: "$month" },
                    number: { $sum: 1 },
                    amount: { $sum: "$amount" },
                }
                let conditionPopulateErr = {
                    path: '_id.executor',
                    select: '_id fullname department',
                    populate: {
                        path: 'department',
                        select: '_id name',
                        model: 'department',
                    },
                    model: 'user'
                }
                let listDataErr = await FNB_MISTAKE_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                        }
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear
                    },
                    {
                        $group: conditionGroupErr
                    },
                    {
                        $sort: {"_id.month": -1}
                    }
                ])
                await FNB_MISTAKE_COLL.populate(listDataErr, conditionPopulateErr)
                // console.log(listDataErr)

                /**
                 * DOANH SỐ
                 */
                let listDataR1 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear1
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR1, conditionPopulate)
                // console.log(listDataR1)
                
                let listDataR2 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear2
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR2, conditionPopulate)
                
                let listDataR3 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear3
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR3, conditionPopulate)
                
                let listDataR4 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear4
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR4, conditionPopulate)
                
                let listDataR5 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear5
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR5, conditionPopulate)

                let listDataR6 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear6
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR6, conditionPopulate)
                let listDataR7 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear7
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR7, conditionPopulate)
                
                let listDataR8 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear8
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR8, conditionPopulate)
                
                let listDataR9 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear9
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR9, conditionPopulate)
                
                let listDataR10 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear10
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR10, conditionPopulate)
                
                let listDataR11 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear11
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR11, conditionPopulate)

                let listDataR12 = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : projectObj
                    },
                    {
                        $match: conditionObjYear12
                    },
                    { 
                        $lookup: lookupObj 
                    },
                    {
                        $unwind: "$staff"
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])
                await FNB_SHIFT_COLL.populate(listDataR12, conditionPopulate)

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_export_kpi.xlsx')))
                .then(async workbook => {
                    var i = 3;
                    listDataR1?.forEach((item, index) => {
                        workbook.sheet("T1").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T1").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T1").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T1").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T1").row(i).cell(5).value(item?.number);
                        workbook.sheet("T1").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR2?.forEach((item, index) => {
                        workbook.sheet("T2").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T2").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T2").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T2").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T2").row(i).cell(5).value(item?.number);
                        workbook.sheet("T2").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR3?.forEach((item, index) => {
                        workbook.sheet("T3").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T3").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T3").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T3").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T3").row(i).cell(5).value(item?.number);
                        workbook.sheet("T3").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR4?.forEach((item, index) => {
                        workbook.sheet("T4").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T4").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T4").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T4").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T4").row(i).cell(5).value(item?.number);
                        workbook.sheet("T4").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR5?.forEach((item, index) => {
                        workbook.sheet("T5").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T5").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T5").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T5").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T5").row(i).cell(5).value(item?.number);
                        workbook.sheet("T5").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR6?.forEach((item, index) => {
                        workbook.sheet("T6").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T6").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T6").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T6").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T6").row(i).cell(5).value(item?.number);
                        workbook.sheet("T6").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR7?.forEach((item, index) => {
                        workbook.sheet("T1").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T1").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T1").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T1").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T1").row(i).cell(5).value(item?.number);
                        workbook.sheet("T1").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR8?.forEach((item, index) => {
                        workbook.sheet("T2").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T2").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T2").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T2").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T2").row(i).cell(5).value(item?.number);
                        workbook.sheet("T2").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR9?.forEach((item, index) => {
                        workbook.sheet("T3").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T3").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T3").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T3").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T3").row(i).cell(5).value(item?.number);
                        workbook.sheet("T3").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR10?.forEach((item, index) => {
                        workbook.sheet("T4").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T4").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T4").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T4").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T4").row(i).cell(5).value(item?.number);
                        workbook.sheet("T4").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR11?.forEach((item, index) => {
                        workbook.sheet("T5").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T5").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T5").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T5").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T5").row(i).cell(5).value(item?.number);
                        workbook.sheet("T5").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    var i = 3;
                    listDataR12?.forEach((item, index) => {
                        workbook.sheet("T6").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("T6").row(i).cell(2).value(item?._id?.staff.fullname);
                        workbook.sheet("T6").row(i).cell(3).value(`${item?._id.staff?.department?.name}`);
                        workbook.sheet("T6").row(i).cell(4).value(item?.avgQuantityPerStaff != null ? Number(item?.avgQuantityPerStaff) : 0)
                        workbook.sheet("T6").row(i).cell(5).value(item?.number);
                        workbook.sheet("T6").row(i).cell(6).value(item?.avgTotalPerStaff);
                        
                        i++
                    });

                    /**
                     * DANH BẠ ĐIỂM BÁN
                     */
                    var i = 3;
                    listDataFunda?.forEach((item, index) => {
                        workbook.sheet("Contact").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("Contact").row(i).cell(2).value(item?.name);

                        for(var m=1; m<=12; m++){
                            listDataContact?.forEach((contact) => {
                                if(contact._id.funda.toString() === item._id.toString() && Number(contact._id.month) === Number(m)){
                                    workbook.sheet("Contact").row(i).cell(m+2).value(contact?.number); 
                                }
                            })
                        }
                        
                        i++
                    });

                    /**
                     * PHẠT LỖI VI PHẠM
                     */
                    var i = 3;
                    listDataErr?.forEach((item, index) => {
                        workbook.sheet("Err").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("Err").row(i).cell(2).value(item?._id?.executor.fullname);
                        workbook.sheet("Err").row(i).cell(3).value(`${item?._id.executor?.department?.name}`);
                        workbook.sheet("Err").row(i).cell(4).value(item?._id.month);
                        workbook.sheet("Err").row(i).cell(5).value(item?.number);
                        workbook.sheet("Err").row(i).cell(6).value(item?.amount);
                        
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `BaoCaoKPI_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });

            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Func: Tải Đơn hàng
     * Date: 4/2/2023
     */
    exportExcel2({ companyID, year, month, userID }) {
        // console.log({ companyID, year, month, userID })
        return new Promise(async resolve => {
            try {
                let listData  = await FNB_ORDER_COLL.find({ company: companyID })
                .populate({
                    path: "funda",
                    select: "name sign",
                })
                .populate({
                    path: "shift",
                    select: "name sign",
                })
                .limit(5000)
                .sort({createAt: -1})
                // console.log(listData)

                let yearFilter
                let currentYear = new Date().getFullYear()
                if(year && !isNaN(year)){
                    yearFilter = Number(year)
                }else{
                    yearFilter = Number(currentYear)
                }

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_export_order.xlsx')))
                .then(async workbook => {
                    var i = 3;
                    listData?.forEach((item, index) => {
                        workbook.sheet("Order").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("Order").row(i).cell(2).value(item?.funda?.name);
                        workbook.sheet("Order").row(i).cell(3).value(item.createAt);
                        workbook.sheet("Order").row(i).cell(4).value(item?.shift?.name);
                        workbook.sheet("Order").row(i).cell(5).value(`${FNB_SHIFT_TYPES[Number(item.shiftType)-1].text}`);
                        workbook.sheet("Order").row(i).cell(6).value(item.name);
                        workbook.sheet("Order").row(i).cell(7).value(item.sign);
                        workbook.sheet("Order").row(i).cell(8).value(`${FNB_SALES_CHANNEL[Number(item.salesChannel)-1].text}`);
                        workbook.sheet("Order").row(i).cell(9).value(item?.appOrderSign);
                        workbook.sheet("Order").row(i).cell(10).value(`${FNB_PAYMENT_METHOD[Number(item.paymentMethod)-1].text}`);
                        workbook.sheet("Order").row(i).cell(11).value(`${FNB_STATUS[Number(item.status)-1].text}`);
                        workbook.sheet("Order").row(i).cell(12).value(Number(item.total));
                        workbook.sheet("Order").row(i).cell(13).value(Number(item.discount));
                        workbook.sheet("Order").row(i).cell(14).value(Number(item.salesoff));
                        workbook.sheet("Order").row(i).cell(15).value(Number(item.amount));
                        workbook.sheet("Order").row(i).cell(16).value(Number(item.numberOfSizeM));
                        workbook.sheet("Order").row(i).cell(17).value(Number(item.numberOfSizeL));
                        workbook.sheet("Order").row(i).cell(18).value(Number(item.numberOfProducts));
                        workbook.sheet("Order").row(i).cell(19).value(Number(item.numberOfMistakes));
                        workbook.sheet("Order").row(i).cell(20).value(item.note);
                        i++
                    });
                   
                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `DanhSachDonHang_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });

            } catch (error) {
                console.log({ error })
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

                // if(option == 1){
                //     await ITEM__CONTACT_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 2){
                //     await FNB_PRODUCT_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 3){
                //     await FNB_ORDER_COLL.deleteMany({ company: companyID })
                //     await FNB_ORDER_PRODUCT_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 4){
                //     await FNB_SHIFT_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 5){
                //     await FNB_MISTAKE_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 6){
                //     await FNB_QUOTA_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 7){
                //     await FNB_ORDER_MATERIAL_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 8){
                //     await FNB_GENERAL_BOOK_COLL.deleteMany({ company: companyID })
                // }

                // if(option == 9){
                //     await ITEM__CONTACT_COLL.deleteMany({ company: companyID })
                //     await FNB_PRODUCT_COLL.deleteMany({ company: companyID })
                //     await FNB_ORDER_COLL.deleteMany({ company: companyID })
                //     await FNB_ORDER_PRODUCT_COLL.deleteMany({ company: companyID })
                //     await FNB_SHIFT_COLL.deleteMany({ company: companyID })
                //     await FNB_MISTAKE_COLL.deleteMany({ company: companyID })
                //     await FNB_QUOTA_COLL.deleteMany({ company: companyID })
                //     await FNB_ORDER_MATERIAL_COLL.deleteMany({ company: companyID })
                //     await FNB_GENERAL_BOOK_COLL.deleteMany({ company: companyID })
                // }
                
                // if(option == 10){
                //     await FNB_PRODUCT_COLL.updateMany({ company: companyID }, {$set: {"images": []}})
                // }

                if(option == 11){
                    await ITEM__CONTACT_COLL.updateMany({ company: companyID }, {$set: {
                        totalLoyaltyPoints: 0,
                        usedLoyaltyPoints: 0,
                        remainLoyaltyPoints: 0,
                    }})
                }

                if(option == 12){
                    await ITEM__CONTACT_COLL.updateMany({ company: companyID }, {$set: {
                        new: 2
                    }})
                }

                return resolve({ error: false, message: 'Reset thành công'});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;