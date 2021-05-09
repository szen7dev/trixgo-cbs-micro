"use strict";
const ObjectID              = require('mongoose').Types.ObjectId;
const utils                 = require('../../utils/utils');
const BaseModel             = require('../intalize/base_model');
let ChildRouter 			= require('../../routing/child_routing');
const APP_COLL              = require('../../database/test/app_coll');
const APP_USER_COLL         = require('../../database/test/app_user_coll');

class Model extends BaseModel {

    constructor() {
        super(require('../../database/test/app_coll'))
    }

    insert({ name, userCreate }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                let slug = utils.convertToSlug(name);
                let isExist = await APP_COLL.findOne({ slug });
                if(isExist)
                    return resolve({ error: true, message: "app_existed" });
                let infoAppAfterInsert = await that.insertData({ 
                    name, slug, userCreate
                });
                if(!infoAppAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });
                return resolve({ error: false, data: infoAppAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    update({ appID, name, userUpdate }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                let isExist = await APP_COLL.findOne( {_id: appID} );
                if(!isExist)
                    return resolve({ error: true, message: "app_existed" });

                let slug = utils.convertToSlug(name);   

                let infoAppAfterUpdate = await APP_COLL.findByIdAndUpdate(appID, {
                    name, slug, userUpdate, modifyAt: Date.now()
                }, { new: true });
                if(!infoAppAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });
                return resolve({ error: false, data: infoAppAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    getListMemberOfCompanyAndApp({ company, app }) {
        return new Promise(async resolve => {
            try {
                let listRecords = await APP_USER_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(company),
                            app: ObjectID(app)
                        }
                    },
                    {
                        $lookup: {
                           from: 'users',
                           localField: 'user',
                           foreignField: '_id',
                           as: 'user'
                       },
                   },
                   {
                       $unwind: "$user"
                   },
                    {
                        $group: {
                            _id: "$app", 
                            data: {
                                $push: '$$ROOT'
                            }
                        }
                    },
                   
                ]);
                return resolve({ error: false, data: listRecords });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }
    /**
     * users: [ { ObjectID } ]
     */
    insertSomeMember({ users, appID, userCreate }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!ObjectID.isValid(appID) || !ObjectID.isValid(userCreate))
                    return resolve({ error: true, message: 'param_not_valid' });

                // Thêm nhiều thành viên vào ứng dụng
                //_______________Kiểm tra xem User đã tồn tại trong App hay chưa
                for(const item of users){
                    let infoAppUser = await APP_USER_COLL.findOne({app: appID, account: item});
                    if(!infoAppUser){
                        await APP_USER_COLL.insertMany({ account: item, app: appID, level: 1, userCreate });
                    }
                }

               //_______________Cập nhật thông tin members cho ứng dụng
                await APP_COLL.findByIdAndUpdate(appID, {
                    $addToSet: {
                        members: {
                            $each: users
                        }
                    },
                    modifyAt: Date.now()
                }, { new: true });
 
                return resolve({ error: false, message: 'insert_success' });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

}

exports.MODEL = new Model;