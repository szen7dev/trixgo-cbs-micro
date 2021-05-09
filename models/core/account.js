"use strict";
const { hash, compare } 	= require('bcryptjs');
const ObjectID              = require('mongoose').Types.ObjectId;
var crypto                  = require('crypto-js'); 
const { sign } 				= require('../../utils/jwt');
const BaseModel             = require('../intalize/base_model');
let ChildRouter 			= require('../../routing/child_routing');
const ACCOUNT_COLL          = require('../../database/test/account_coll');

class Model extends BaseModel {

    constructor() {
        super(require('../../database/test/account_coll'))
    }
    

    getList(ctx) {
		return new Promise(async resolve => {
			try {
				let listUser = await ACCOUNT_COLL.find({});
				// let listUserDe = await ACCOUNT_COLL.removeMany({firstName: "Thomas"});
				// console.log(listUserDe);
				if (!listUser) {
					return resolve({ error: true, message: 'cannot_get_listUser',  data: listUser });
				}
                // Cipher data must be a string or a buffer
                const unencryptedSecret = JSON.stringify(listUser);
 
                // Mã hóa
                var listUserEncryted = await crypto.AES.encrypt(unencryptedSecret, process.env.SECRET_KEY_CRYPTO).toString();


                // Xử lí mã hóa data bên phía client
                // Xem chuỗi đã mã hóa
                // Lấy danh sách byte đã mã hóa
                // var bytes = crypto.AES.decrypt(listUserEncryted, process.env.SECRET_KEY_CRYPTO);

                // Chuyển sang chuỗi gốc    
                //var message_decode = JSON.parse(bytes.toString(crypto.enc.Utf8)) ;
                
                //console.log({message_decode}); 
               
                return resolve({ error: false, message: 'get_list_user_success', data: listUserEncryted });
                // ChildRouter.responseSuccess({ ctx, error: false, message: 'get_list_user_success', data: listUser })
			} catch (error) {
				return resolve({ error: true, message: error.message, data: [] });
			}
		})
	};

    findById({userID}) {
		return new Promise(async resolve => {
			try {
				let infoUser = await ACCOUNT_COLL.findById(userID);
				if (!infoUser) {
					return resolve({ error: true, message: 'cannot_get_info_user',  data: infoUser });
				}
               
                return resolve({ error: false, message: 'get_list_info_user_success', data: infoUser });
			} catch (error) {
				return resolve({ error: true, message: error.message, data: [] });
			}
		})
	};

	register({ email, fullName, password, role }) {
		return new Promise(async resolve => {
            try {
                //CHECK COMPLETED ALL FIELDS
                if (!email || !fullName || !password) {
                    return resolve({ error: true, message: 'have_not_completed_all_fields', data: [] });
                }

                let emailValid = email.toLowerCase().trim();
                let isExistUser = await ACCOUNT_COLL.findOne({
                    email: emailValid
                });
                //CHECK EMAIL ALREADY EXIST
                if (isExistUser)
                    return resolve({ error: true, message: 'email_exists', data: [] });

                let hashPassword = await hash(password, 8);
				if (!hashPassword) return resolve({ error: true, message: 'cannot_hash_password', data: [] });
				let dataInsert = {
                    email, fullName, password: hashPassword
                }
                if(role)
                    dataInsert.role = role;
                let createNewUser = new ACCOUNT_COLL(dataInsert);
                let newUser = await createNewUser.save();
		
                if (!newUser) {
                    return resolve({ error: true, message: 'cannot_insert_user', data: [] });
                }
                return resolve({ error: false, message: 'insert_success', data: { user: newUser } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
	};

	login({email, password}) {
		return new Promise(async resolve => {
            try {
                let emailConvert = email.toLowerCase().trim();
                let infoUser = await ACCOUNT_COLL.findOne({ email: emailConvert });
                if (!infoUser) return resolve({ error: true, message: 'email_not_exist', data: [] });

                const isMatchPass = await compare(password, infoUser.password);
                if (!isMatchPass) return resolve({
                    error: true,
                    message: 'password_not_exist', data: []
                });

                await delete infoUser.password;
				let token = await sign({ infoUser });
				
				// ctx.meta.$responseHeaders = {
				// 	'Set-Cookie': `session_token=${token};Path=/;Max-Age=${Number(process.env.COOKIE_MAXAGE) *
				// 		60}`,
				// };

                return resolve({
                    error: false,
                    message: 'login_success',
                    data: { user: infoUser, token }
                });

            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        });
    };

    updateInfo({accountID, fullName}) {
        const that = this;
		return new Promise(async resolve => {
            try {
                if(!fullName)
                    return resolve({ error: true, message: "not_found_field" });
                console.log({fullName});
                let isExist = await ACCOUNT_COLL.findById(accountID);
                if(!isExist)
                    return resolve({ error: true, message: "not_found_account" });

                let dataUpdate = { fullName }

                await that.updateWhereClause({ _id: accountID }, dataUpdate);
                return resolve({
                    error: false,
                    message: 'update_success',
                });

            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        });
    };

}

exports.MODEL = new Model;