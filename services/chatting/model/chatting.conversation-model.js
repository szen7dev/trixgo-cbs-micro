"use strict";

const BaseModel                                 = require('../../../tools/db/base_model');
const ObjectID                                  = require('mongoose').Types.ObjectId;

const CHATTING__CONVERSATION_COLL               = require('../database/chatting.convensation-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');
const FILE__FILE_COLL                           = {};
const FILE__REMOVED_MODEL                       = {};

const { checkObjectIDs }                            = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                     = require('../../../tools/cursor_base/playground/index');

/**
 * MODEL
 */
const CHATTING__MESSAGE_MODEL  = require('../model/chatting.message-model.js').MODEL;

class Model extends BaseModel {

    constructor() {
        super(require('../database/chatting.convensation-coll'));
    }

    // Click vào một User trên danh sách => Tạo cuộc hội thoại riêng tư
    insert({ name, description, authorID, receiverID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(authorID) || !checkObjectIDs(receiverID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                // Kiểm tra nếu tồn tại cuộc hội thoại của hai người thì không tạo nữa
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({ 
                    members: { $all: [authorID, receiverID] }
                })
                
                for(let  i= 0; i< checkExistConversation.length; i++){
                    if(checkExistConversation[i].members.length == 2){
                        return resolve({ error: true, message: 'Request params invalid', status : 400 });
                    }
                }

                let infoConversationAfterInserted = await that.insertData({ name, description, author: authorID });

                if(!infoConversationAfterInserted)
                    return resolve({ error: true, message: "Can't create", status : 403 });

                
                let { _id: conversationID } = infoConversationAfterInserted;

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    // members: [receiverID, authorID], // Tham khảo phương thức này
                    $addToSet: {
                        members: {
                            $each: [receiverID, authorID]
                        }
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't create", status : 403 });


                infoConversationAfterUpdated =  await CHATTING__CONVERSATION_COLL.findById(infoConversationAfterUpdated._id).populate({
                    path: 'members',
                    select: '_id fullname image company friends receiveFromFriends sendToFriends ',
                    populate: {
                        path: "company"
                    }
                })

                return resolve({ error: false, data: infoConversationAfterUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Tạo cuộc hội thoại nhiều hơn hai thành viên ( Nhóm chat )
    insertConversationMoreTowMember({ name, description, authorID, receivers }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                // await that.insertData({ name : 'tesst', description : 'tesst', author: authorID });
                // return resolve({ errror : false, message : 'scueess' })
                let arrReceiver = [];
                if(receivers.includes(',')) {
                    arrReceiver = receivers.split(',');
                } else {
                    arrReceiver.push(receivers);
                }

                // KIỂM TRA ĐIỀU KIỆN HỢP LỆ
                if(Number(arrReceiver.length) <= 1)
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                if(Number(arrReceiver.length) >= 100)
                        return resolve({ error: true, message: 'Members over 100', status : 400 });

                arrReceiver.forEach(reciver=>{
                    if(!checkObjectIDs(reciver))
                        return resolve({ error: true, message: 'Request params invalid', status : 400 });
                })

                if(!checkObjectIDs(authorID)  || !Array.isArray(arrReceiver))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });


                let exitsConversation = await CHATTING__CONVERSATION_COLL.find({ name, members : [...arrReceiver, authorID] });

                // Kiểm tra xem có cuộc hội thoại nào trung tên chưa
                if(exitsConversation.length > 0)
                    return resolve({ error: true, message: 'Name conversation exited', status : 400 });

                let infoConversationAfterInserted = await that.insertData({ name, description, author: authorID });

                if(!infoConversationAfterInserted)
                    return resolve({ error: true, message: 'Cant create', status : 403 });

                let { _id: conversationID } = infoConversationAfterInserted;

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $addToSet: {
                        members: {
                            $each: [...arrReceiver, authorID]
                        }
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant create', status : 403 });

                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Cập nhật Link
    /* Author: Hoang
    * Date: 31/10/2010 - 4:10 PM.
    * Usage: save links.
    */
    updateLinks({ conversationID, userID, links }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                let infoUpdateLinks;
                let checkExits = await CHATTING__CONVERSATION_COLL.findOne({ _id : conversationID, members : {$in :[userID]}});
                if(!checkExits)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                    
                let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
                let oldLinks = infoConversation.links;
                let newLinks = [...oldLinks];
                if(oldLinks){
                    links.map((link, index) => {
                        if(!oldLinks.includes(link)){
                            newLinks.push(link);
                        }
                    })
                }
                infoUpdateLinks =await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,{
                    links: newLinks
                }, { new: true });
                if(!infoUpdateLinks)
                    return resolve({ error: true, message: 'Cant update', status : 403 });

                return resolve({ error: false, data: infoUpdateLinks, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Cập nhật logo
    /* Author: Hoang
    * Date: 18/10/2010 
    * Update: save file logo change.(remove S3 rontab)
    */
    updateLogo({ conversationID, userID, filesID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(filesID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                let infoUpdateMessage;
                let checkExits = await CHATTING__CONVERSATION_COLL.findOne({ _id : conversationID, author : {$in :[userID]}});
                if(!checkExits)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                infoUpdateMessage =await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,{
                    logo: filesID
                }, { new: true });
                if(!infoUpdateMessage)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                let infoFile = await FILE__FILE_COLL.findById(filesID);
                let result = await FILE__REMOVED_MODEL.insert({name: infoFile.name, path: infoFile.path});
                await FILE__FILE_COLL.removeByID(filesID);
                return resolve({ error: false, data: infoUpdateMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Cập nhật cuộc tên và mô tả hội thoại
    updateByID({ name, description, conversationID, userID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                let dataUpdate = {};
                let checkExistConversation;
                if(name){
                    dataUpdate.name = name;
                    checkExistConversation = await CHATTING__CONVERSATION_COLL.find({name : name});
                    if(!checkExistConversation)
                        return resolve({ error: true, message: 'New name Exits', status : 403 });
                }else{
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                }
                if(description){
                    dataUpdate.description = description;
                }

                if(!dataUpdate)
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID, 
                    members: { $in: [userID],
                     }
                });
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'You are not member', status : 403 });

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, dataUpdate, { new: true})
                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant update', status : 403 });
    
                return resolve({ error: false, data: infoConversationAfterUpdated, oldName : checkExistConversation.name, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**

    * Name: Cập nhật thông tin công việc

    * Author: VinhNH 

    * Updated:
   
    * - 12/10/2020-VinhNH: Cập nhật lại populate cho mobiles

    * Usage:

    * - Web: Cập nhật thông tin công việc 

    * - Mobile:  Cập nhật lại populate cho mobiles : cập  nhật  ngày gửi tin , ngày tương tác tin nhắn

    */
    // Lấy danh sách các cuộc hội thoại của một người dùng 
    getListConversationByAuthorID({ authorID, currentPage, nextInfo }){
        const that = this;

        return new Promise(async resolve => {
            try {
                const page  = Number(currentPage) || 1;
                let perPage = 20;
                let listConversation;

                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: '400 Bab request params invalid', status : 400 });
                    
                // listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                
                let _sort = {
                    modifyAt: -1,
                    creatAt: -1
                }
                let ObjectSearch            = {};
                if(page!=1){
                    let dataPaggingAndSort = await RANGE_BASE_PAGINATION({ nextInfo : nextInfo, keys: ['modifyAt__-1', '_id__-1'] })
                    if(!dataPaggingAndSort || (dataPaggingAndSort && dataPaggingAndSort.error) )
                        return resolve({ error: true, message: '400 Bab request params invalid', status : 400 });

                    _sort                               =  dataPaggingAndSort.data.sort
                    ObjectSearch                        = dataPaggingAndSort.data.find;
                }

                ObjectSearch.members        =   { $in: [ObjectID(authorID)] };
                listConversation = await CHATTING__CONVERSATION_COLL.find(ObjectSearch)
                .populate({
                    path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                })
                // .populate({
                //     path: 'members',
                //     select: '_id fullname image company friends receiveFromFriends sendToFriends',
                // })
                // .populate({
                //     path: 'logo'
                // })
                .populate({
                    path : 'pin', select : '_id sender content status' 
                })
                // .populate({
                //     path: 'taskID',
                //     select : 'task',
                //     populate : {
                //         path : 'task', select : '_id name'
                //     }
                // })
                .sort(
                   {
                    modifyAt: -1,
                    createAt: -1,
                    updateAt: -1
                   }
                )
                .limit(perPage);
                
                let amoutConverMiss  = await CHATTING__CONVERSATION_COLL.count({ arrMissMessage :  { $elemMatch: { userID:authorID, amout: { $gte: 1} } } })
                
                return resolve({ error: false, data: listConversation, amoutConverMiss,  status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Lấy thông tin cuộc hội thoại của user
    getInfoByUserID({ conversationID, userID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Bab request params invalid', status : 400 });

                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [userID]} })
                    // .populate({
                    //     path: 'members',
                    //     select: '_id fullname image company friends receiveFromFriends sendToFriends converMiss birthDay username phone email',
                    //     populate: {
                    //         path: "company"
                    //     }
                    // })
                    // .populate('logo')
                    // .populate({
                    //     path: 'lastMessage'
                    // })
                    // .populate({
                    //     path: 'taskID',
                    //     select : 'task',
                    //     populate : {
                    //         path : 'task', select : '_id name'
                    //     }
                    // })
                    // .populate({
                    //     path : 'pin', populate :  'sender' 
                    // })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path : 'pin', select : '_id sender content status' 
                    })
                    .lean();
                    
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status : 403 });

                return resolve({ error: false, data: infoConversation,  status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Lấy danh sách thông tin thành viên trong cuộc hội thoại
    getInfoMembersByID({ conversationID, userID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [userID]} })
                    // .populate({
                    //     path: 'members',
                    //     select: '_id fullname image company friends receiveFromFriends sendToFriends converMiss birthDay username phone email',
                    //     populate: {
                    //         path: "company"
                    //     }
                    // })
                    // .populate('logo')
                    // .populate({
                    //     path: 'lastMessage'
                    // })
                    // .populate({
                    //     path: 'taskID',
                    //     select : 'task',
                    //     populate : {
                    //         path : 'task', select : '_id name'
                    //     }
                    // })
                    // .populate({
                    //     path : 'pin' 
                    // })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path : 'pin', select : '_id sender content status' 
                    })
                    .lean();
                    
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status : 403 });

                let listMemebersID  = infoConversation.members;
                let listMembers =  await  AUTH__USER_COLL.find({ _id : { $in: listMemebersID } }).select('_id fullname email image position sendToFriends receiveFromFriends recentlyFriends friends');

                return resolve({ error: false, data: listMembers, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Tìm thành viên trong cuộc hội thoại
    getInfoMembersWithKey({ conversationID, userID, key }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });


                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [userID]} })
                    // .populate({
                    //     path: 'members',
                    //     select: '_id fullname image company friends receiveFromFriends sendToFriends converMiss birthDay username phone email',
                    //     populate: {
                    //         path: "company"
                    //     }
                    // })
                    // .populate('logo')
                    // .populate({
                    //     path: 'lastMessage'
                    // })
                    // .populate({
                    //     path: 'taskID',
                    //     select : 'task',
                    //     populate : {
                    //         path : 'task', select : '_id name'
                    //     }
                    // })
                    // .populate({
                    //     path : 'pin' 
                    // })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path : 'pin', select : '_id sender content status' 
                    })
                    .lean();
                    
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status : 403 });


                let listMemebersID  = infoConversation.members;
                let listMembers =  await  AUTH__USER_COLL.find({ _id : { $in: listMemebersID }, fullname: new RegExp(key, 'i') }).select('_id fullname email image position sendToFriends receiveFromFriends recentlyFriends friends');

                return resolve({ error: false, data: listMembers });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Lấy thông tin cuộc hội thoại của user
    getListConversationMissMessage({  userID, currentPage, nextInfo}){
        return new Promise(async resolve => {
            try {
                let page    = Number(currentPage || 1) || 1;
                let perPage = 3;
                // Kiểm tra đầu vào
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const infoConversation = await AUTH__USER_COLL.findById(userID);
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status : 403 });

                let listConversationMiss =  infoConversation.converMiss || [];

                // Thiết lập điều kiện tìm kiếm
                let _sort = {
                    modifyAt: -1,
                    creatAt: -1
                }
                let ObjectSearch           = {};
                if(page!=1){
                    let dataPaggingAndSort = await RANGE_BASE_PAGINATION({ nextInfo : nextInfo, keys: ['modifyAt__-1', '_id__-1'] })
                    if(!dataPaggingAndSort || (dataPaggingAndSort && dataPaggingAndSort.error) )
                        return resolve({ error: true, message: 'Request params invalid', status : 400 });

                    _sort                               =  dataPaggingAndSort.data.sort
                    ObjectSearch                        =  dataPaggingAndSort.data.find;
                }

                ObjectSearch._id        =   { $in: listConversationMiss };
                ObjectSearch.members    =   { $in: [userID] };
                

                const conversations = await CHATTING__CONVERSATION_COLL.find(ObjectSearch).limit(perPage).sort(_sort);
                return resolve({ error: false, data: conversations, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }


    // Xóa cuộc hội thoại của author tạo ra, xóa luôn tất cả tin nhắn có trong message
    removeByID({ conversationID, authorID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [authorID] }});
                if (!infoConversation)
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkRemoveAllMessage = await CHATTING__MESSAGE_MODEL.removeAllByConversationID({ conversationID });
                if (!checkRemoveAllMessage) 
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                return resolve({ error: false, data: infoConversation });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Rời khỏi cuộc hội thoại (nhóm chat)
    leaveByConversationID({ userID, conversationID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(authorID) || !checkObjectIDs(conversationID)) 
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
               
                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pull: {
                        members: userID
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant leave', status : 403 });
                
                return resolve({ error: false, data: infoConversationAfterUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Xóa một user khỏi cuộc hội thoại (nhóm chat)
    removeMembersFromConversionByID({ members, conversationID, authorID }) {
        return new Promise(async (resolve) => {
            try {
                let arrMember = [...members.split(',')];
                // if(members.includes(',')) {
                //     arrMember = members.split(',');
                // } else {
                //     arrMember.push(members);
                // }\

                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID) || !Array.isArray(arrMember))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });


                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, author: authorID, members: { $in: [...arrMember] }});
                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't permission", status : 403 });

                if(checkExistConversation.members.length <= 3){
                    // let resultDeleteConverSation = await CHATTING__CONVERSATION_COLL.findByIdAndDelete({ conversationID }); 
                    return resolve({ error: false, data: checkExistConversation, status : 200});
                }
                
                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pullAll: {
                        members: [...arrMember]
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant remove', status : 403 });
                
                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Thêm các member vào cuộc hội thoại
    addMembersToConversionByID({ members, conversationID, authorID }) {
        return new Promise(async (resolve) => {
            try {
                let arrMember = [];
                // console.log({ members, conversationID, authorID })
                if(members.includes(',')) {
                    arrMember = members.split(',');
                } else {
                    arrMember.push(members);
                }
                arrMember.forEach(member=>{
                    if(!checkObjectIDs(member)){
                        return resolve({ error: true, message: 'Request params invalid', status : 400 });
                    }
                });

                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID)  || !Array.isArray(arrMember))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                if(arrMember.includes(authorID))
                    return resolve({ error: true, message: 'Cant create', status : 403 });

                
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, author: authorID });
                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author", status : 403 });

                let listMembers = checkExistConversation.members;
                for(let i=0;i < listMembers.length; i++){
                    if(arrMember.includes(listMembers[i].toString())){
                        return resolve({ error: true, message: 'Conversation exits', status : 403  });
                    }
                }
                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $push: {
                        members : {$each  : arrMember }
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant create', status : 403  }); 
                
                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200  });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Set admin mới cho nhóm
    insertNewAdmin({ member, conversationID, authorID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID)  || !checkObjectIDs(member) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, author: authorID });
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                member = [member]
                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $addToSet: {
                        author: [...member]
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant create', status : 403  }); 
                
                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // xoá admin 
    /* Author: Vinh
    * Update: Hoang - Date: 21/10/2010 
    * fix "infoConversationAfterUpdated is not defined"
    */
    removeAdmin({ adminID, conversationID, authorID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID)  || !checkObjectIDs(adminID) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, author: authorID });
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                
                let infoConversationAfterUpdated;
                if(checkExistConversation.author[0].toString() != adminID.toString()){
                    infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        $pull : {
                            author: adminID
                        }, 
                    }, { new: true });
    
                }else{
                    return resolve({ error: true, message:  'Permission denied', status : 403  });
                }   
                
                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant Creata', status :403 });
                
                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Tìm kiếm cuộc hội thoại  theo tên
    getListCoversationWithKey({ key, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(userID) || !key )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let listUsers = await CHATTING__CONVERSATION_COLL.find({
                        members: { $in: [userID]},
                        name: new RegExp(key, 'i')
                    })
                    // .populate({
                    // path : 'members',
                    // select: '_id fullname image company friends receiveFromFriends sendToFriends'
                    // })
                    // .populate('logo')
                    // .populate({
                    //     path: 'lastMessage'
                    // })
                    .limit(30)
                    .sort({modifyAt: -1})
                return resolve({ error: false, data: listUsers, status : 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // Thêm tin nhắn ghim
    // Tìm kiếm cuộc hội thoại
    insertPinMessage({ messageID, conversationID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID) || !checkObjectIDs(conversationID) || !checkObjectIDs(userID) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let exitCoversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID]}
                });

                if(!exitCoversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }

                let infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    pin : messageID
                })

                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID)
                // .populate({ path : 'pin', populate :  { path : 'sender', select :'_id fullname  image'  }});
                return resolve({ error: false, data: infoConversation, status : 200})
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // xóa ghim của cuộc hội thoại
    deletePinMessage({ conversationID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let exitCoversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID]}
                });

                if(!exitCoversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }

                let infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,
                    {
                        $unset : { pin :'' }
                    })
                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID)
                .populate({ path : 'pin', populate :  { path : 'sender', select :'_id fullname  image'  }});

                return resolve({ error: false, data: infoConversation, status :200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    updateUserMissMessage({ conversationID, userID, isRep, sender }) {
        return new Promise(async resolve => {
            try {
                let infoConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID] }
                });
                let infoUser = await AUTH__USER_COLL.findById(userID);
                if(!infoConversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }
                let infoUpdate;
                let arr = infoConversation[0].arrMissMessage;
                let newArr = [];

                // Kiểm  miss cuojc hội thoại là miss lần đầu hay đã miss rồi
                let isMiss = false;

                // Chưa tìm được câu query tốt nên xử lý theo luồng sau
                // Lấy danh sách miss tin nhắn tìm user miss sau đó cập nhật mảng mới cho conversation
                if(isRep){
                    if(infoConversation[0].arrMissMessage){
                        for(let i=0; i < arr.length; i++){
                            // console.log({id  : arr[i].userID});
                            if(arr[i].userID.toString() == userID.toString()){
                              
                            }else{
                                newArr.push(arr[i]);
                            }
                        }
                    }
                    infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                        conversationID
                    ,
                    {
                        arrMissMessage:  newArr
                    });
                 
                    if(infoUser.converMiss.length > 0){
                        await AUTH__USER_COLL.findByIdAndUpdate(
                            userID,{
                                $pull: {
                                    converMiss: conversationID
                                }
                        })
                    }
                }else{
                    if(!infoUser.converMiss.includes(conversationID)){
                        conversationID = [conversationID]
                       let result= await AUTH__USER_COLL.findByIdAndUpdate(
                            userID,{
                                $addToSet: {
                                    converMiss: [...conversationID]
                                }
                        })
                    }
                   
                    if(infoConversation[0].arrMissMessage){
                        for(let i=0; i < arr.length; i++){
                            if(arr[i].userID.toString() == userID.toString()){
                                let newAmout = Number(arr[i].amout) + 1;
                                let newItem = { _id : arr[i]._id, userID : userID, amout : newAmout }
                                newArr.push(newItem);
                                isMiss = true;
                            }else{
                                newArr.push(arr[i]);
                            }
                        }
                    }
                    
                    if(isMiss){
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                            conversationID
                        ,
                        {
                            arrMissMessage:  newArr
                        });
                    }else{
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,
                        {
                            $addToSet: {
                                arrMissMessage:[ {
                                 userID : userID,  amout : 1
                                }]
                            }   
                        });
                      
                    }
               
                }
                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                return resolve({ error: false, data: infoUpdate, status : 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    updateMessageTyping({ conversationID, userID, content }) {
        return new Promise(async resolve => {
            try {
                let infoConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID]}
                    });
                let infoUser = await AUTH__USER_COLL.findById(userID);
                if(!infoConversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }
                content = content.trim()
                let infoUpdate;
                let arr = infoConversation[0].arrMesageTypingUsers;
                let newArr = [];
                // Kiểm  typing cuojc hội thoại là miss lần đầu hay đã typing rồi
                let isTyping = false;
                // Chưa tìm được câu query tốt nên xử lý theo luồng sau
                // Lấy danh sách miss tin nhắn tìm user miss sau đó cập nhật mảng mới cho conversation
                   
                if(infoConversation[0].arrMesageTypingUsers){
                    if(arr.length > 0){
                        for(let i=0; i < arr.length; i++){
                            if(arr[i].userID.toString() === userID.toString()){
                                isTyping = false;   // nếu có rồi;
                                break;
                            }else{
                                isTyping = true;// nếu chưa có trong mãng
                            }
                        }
                        if(isTyping){
                            let newItem = { userID : userID, messageTyping : content  }
                            newArr.push(newItem);
                            newArr = newArr.concat(arr);
                        }else{
                            for(let i=0; i < arr.length; i++){
                                if(arr[i].userID.toString() == userID.toString()){
                                    let newItem = { _id : arr[i]._id, userID : userID, messageTyping : content }
                                    newArr.push(newItem);
                                }else{
                                    newArr.push(arr[i]);

                                }
                            }
                        }
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                            conversationID
                        ,
                        {
                            arrMesageTypingUsers:  newArr
                        });
                    
                    }else{
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                            conversationID
                        ,
                        {
                            arrMesageTypingUsers:  [ { userID , messageTyping : content } ]
                        });
                    }
                }
        
                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                return resolve({ error: false, data: infoUpdate, status : 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    updateUserOffline({  userID, time }) {
        return new Promise(async resolve => {
            try {
                let infoConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [userID] } });
                if(!infoConversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }
                
                let infoUpdate;
                let arr;
                let newArr = [];
                let conversationID ;

                for(let i=0; i< infoConversation.length; i++){
                    if(infoConversation[i].members.length ==2){
                        arr = infoConversation[i].arrMissMessage;
                        conversationID   = infoConversation[i]._id;
                        let hadArrMiss = false;

                        if(arr){
                            for(let i=0; i < arr.length; i++){
                                if(arr[i].userID.toString() == userID.toString()){
                                    let newItem = { _id : arr[i]._id, userID : userID, amout :  arr[i].amout, timeOffline : time }
                                    newArr.push(newItem);
                                    hadArrMiss = true;
                                }else{
                                    newArr.push(arr[i]);
                                }
                            }
                        }
                        if(hadArrMiss){
                            infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                                    conversationID
                                ,
                                {
                                    arrMissMessage:  newArr
                                });
                        }else{
                            infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,
                                {
                                    $addToSet: {
                                        arrMissMessage:[ {
                                            userID : userID,  amout : 0,  timeOffline : time
                                        }]
                                    }   
                                });
                        }
                        
                        newArr = [] 
                    }
                }
              
                // Chưa tìm được câu query tốt nên xử lý theo luồng sau
                // Lấy danh sách miss tin nhắn tìm user miss sau đó cập nhật mảng mới cho conversation
                return resolve({ error: false, message:'update_success', status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // Cập nhật tên các cuộc hội thoại riêng tư để phục vụ tìm kiếm cho dễ dàng
    updatePrivateName() {
        return new Promise(async resolve => {
            try {
               let allConversationPrivate = await CHATTING__CONVERSATION_COLL.find({
                members: { $size: 2 }
               }).populate({
                   select :'fullname',
                   path :'members'
               })

               for (const  conversation of allConversationPrivate){
                    let newName ='';
                    conversation.members.forEach(member=>{
                        newName += ` ${member.fullname}`;
                    });
                    let result = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversation._id,{
                        name : newName
                    });
               }
               return resolve({ error: false, message: '=============DONE===========' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // Xóa các cuộc hội thoại riêng tư do tạo trùng nhiều lần
    RemovePrivateCoincide() {
        return new Promise(async resolve => {
            try {
               let allConversationPravite = await CHATTING__CONVERSATION_COLL.find({
                members: { $size: 2 }
               }).populate({
                   select :'_id',
                   path :'members'
               });

               let arrRemove =[];
               let arrRoot = [];

               for(let i =0; i< allConversationPravite.length ; i++){
                    let _members = allConversationPravite[i].members;
                    if(!arrRemove.includes( allConversationPravite[i]._id)){
                        arrRoot.push(allConversationPravite[i]._id);
                        for(let y =0; y< allConversationPravite.length; y++){
                            let isCoincide = true;
                            allConversationPravite[y].members.forEach(member=>{
                                if(!_members.includes(member)){
                                    isCoincide = false;
                                }
                            })
                            if(isCoincide){
                                if(!allConversationPravite[y].lastMessage && !arrRemove.includes(allConversationPravite[y]._id) &&!arrRoot.includes(allConversationPravite[y]._id)){
                                    arrRemove.push(allConversationPravite[y]._id);
                                }
                            }
                        }
                    }
                  
               }
               
               for (const  itemRemove of arrRemove){
                   let resultDelete  = await CHATTING__CONVERSATION_COLL.findOneAndRemove({ _id: `${itemRemove}`});
               }

                let _arrRemove =[];
                let _arrRoot = [];
                for(let i = allConversationPravite.length -1; i>=0; i--){
                    let _members = allConversationPravite[i].members;
                    if(!_arrRemove.includes( allConversationPravite[i]._id)){
                        _arrRoot.push(allConversationPravite[i]._id);
                        for(let y =allConversationPravite.length -1; y>=0; y--){
                            let isCoincide = true;
                            allConversationPravite[y].members.forEach(member=>{
                                if(!_members.includes(member)){
                                    isCoincide = false;
                                }
                            })
                            if(isCoincide){
                                if(!allConversationPravite[y].lastMessage && !_arrRemove.includes(allConversationPravite[y]._id) &&!_arrRoot.includes(allConversationPravite[y]._id)){
                                    _arrRemove.push(allConversationPravite[y]._id);
                                }
                            }
                        }
                    }
                
            }
            
            for (const  itemRemove of _arrRemove){
                let resultDelete  = await CHATTING__CONVERSATION_COLL.findOneAndRemove({ _id: `${itemRemove}`});
            }
                return resolve({ error: false, message: '=============DONE===========' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    /**
    * Name: Cập nhật thông tin công việc
    * Author: VinhNH 
    * Updated:
    * - 12/10/2020-VinhNH: Cập nhật lại populate cho mobiles
    * Usage:
    * - Web: Cập nhật thông tin công việc
    * - Mobile:  Cập nhật lại populate cho mobiles : ngày gửi tin, ngày tương tác tin nhăn
    */
    // lấy  các cuộc hội thoại phân trang
    getConversationWithPage({ authorID, currentPage, isMobile }){
        return new Promise(async(resolve)=>{
            try {
                const page = Number(currentPage) || 1;
                let perPage = 20;
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let listConversation;
                if(!isMobile){
                    listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path: 'members',
                        select: '_id fullname image company friends receiveFromFriends sendToFriends',
                    })
                    .populate({
                        path: 'logo'
                    })
                    .populate({
                        path : 'pin', select : 'sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .sort({
                        modifyAt: -1,
                        creatAt: -1
                    }).skip((page * perPage) - perPage)
                    .limit(perPage)
                }else{
                    perPage = 12;
                    listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path: 'members',
                        select: '_id fullname image company ',
                    })
                    .populate({
                        path: 'logo'
                    })
                    .populate({
                        path : 'pin', select : 'sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .sort({
                        modifyAt: -1,
                        creatAt: -1
                    }).skip((page * perPage) - perPage)
                    .limit(perPage)
                }

                let infoUser = await AUTH__USER_COLL.findById(authorID);
                let amountNotificationNotSeen = infoUser.converMiss &&  infoUser.converMiss.length;
                
                return resolve({ error: false, data: listConversation, page, amountNotificationNotSeen });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // lấy  các cuộc hội thoại
    getAllConversation({ authorID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                    .populate({
                        path: 'lastMessage'
                    })
                    .populate({
                        path: 'members',
                        select: '_id fullname image company friends receiveFromFriends sendToFriends',
                    })
                    .populate({
                        path: 'logo',
                        select: 'path'
                    })
                    .populate({
                        path : 'pin', populate :  'sender' 
                    })
                    .sort({
                        modifyAt: -1,
                        creatAt: -1
                    })


             
                
                return resolve({ error: false, data : listConversation, status : 200});
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    //
    updateStatusMessageMiss({ authorID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let  infoUser = await AUTH__USER_COLL.findById(authorID);
                let lisConverMiss = infoUser.converMiss
                if(lisConverMiss){
                    for(const conver of lisConverMiss){
                        let converMis =  await CHATTING__CONVERSATION_COLL.findById(conver)
                        let lastMessage = converMis.lastMessage;
                        let infoAffterUpdate = await CHATTING__MESSAGE_MODEL.updateRecive({ messageID : lastMessage })
                    }
                    return resolve({ error: false, message : 'updated_success', status: 200 });
                }else{
                    return resolve({ error: false, message : 'nothing_update', status: 200 });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Author  : VinhNh
    // 16/10/2020
    // Lấy thông tin của một thành viên trong cuộc hội thoaij
    //
    // getInfoOneMembersInConversation()
    getInfoOneMembersInConversation({ conversationID, authorID, memberID }){
        return new Promise(async(resolve)=>{
            try {

                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID) || !checkObjectIDs(memberID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                //  Kiểm tra người yêu cầu thông tin của thành viên trong cuộc hội thoại cả 2 có cùng cuộc hội thoại  không 
                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $all: [authorID, memberID] }
                });
                if(!checkExistConversation || checkExistConversation.length == 0)
                    return resolve({ error: true, message:  'Permission denied', status : 403  });

                let infoUser  =  await   AUTH__USER_COLL.findById(memberID).select('_id fullname image email username phone birthDay');

                if(!infoUser)
                    return resolve({ error: true, message:  'Permission denied', status : 403  });

                return resolve({ error: false, data :  infoUser, status : 200});

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * 
     * @param {conversationID} ID of groupchat
     * @param {conversationID} authorID of user 
     */
    getLinks({ conversationID, authorID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.find({
                    _id: conversationID ,
                    members: { $in: [authorID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let dataConversation = await CHATTING__CONVERSATION_COLL.find({ _id: conversationID});
                if(dataConversation && dataConversation[0]){
                    let links = dataConversation[0].links;
                    return resolve({ error: false, data : { links }, status : 200 });
                }
                    return resolve({ error: false, data : { }, status :200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * author : HuynhVinh
     * decription : chức năng gắn taskID mặt định cho các cuộc hội thoại
     * phục vụ cho việc giao việc (giúp xếp giao việc)
     */
    configTaskDefaults({ conversationID, authorID, taskID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $in: [authorID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                let listTaskID =  isMemberInConversation.taskID;
                let newList = [];
                if(!listTaskID){
                    newList = [{
                        task  : taskID, 
                        userCreate : authorID
                    }]
                }else{
                    listTaskID.forEach(item=>{
                        if(item.userCreate.toString() == authorID.toString() ){
                            newList.push({
                                task  : taskID, 
                                userCreate : authorID
                            })
                        }else{
                            newList.push({
                                task  : taskID, 
                                userCreate : authorID
                            })
                        }
                    })
                }
                let dataConversation = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,{
                    taskID : newList
                });
                if(!dataConversation) 
                    return resolve({ error: true, message:  'Cant update', status : 403  });

                return resolve({ error: false, data:  dataConversation });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * author : HuynhVinh
     * decription : chức năng Tắt thông báo của cuộc  hội thoại
     * 
    */
    muteConversation({ conversationID, userID, time }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID) || !time)
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let listMute =  isMemberInConversation.usersMute;
                let resultUpdate;
                if(!listMute || (listMute && !listMute.length)){
                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, { usersMute : [{ user : userID, time }] })
                }
                if(listMute && listMute.length){
                    let newMuteUser = [];
                    let isNewUser  = true;
                    listMute.forEach(user=>{
                        let _user = {};
                        if(user.user && user.user.toString() ==  userID.toString()){
                            _user.user = user.user;
                            _user.time = time;
                            _user._id = user._id;
                            isNewUser = false;
                        }

                        if(user.user  && user.user.toString() !=  userID.toString()){
                            _user = user;
                        }
                        newMuteUser.push(_user);
                    })

                    if(isNewUser){
                        newMuteUser.push({ user : userID, time })
                    }

                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, { usersMute : newMuteUser })
                }
                
                if(!resultUpdate)
                    return resolve({ error: true, message:'Cant udpate',  status : 403 });

                return resolve({ error: false, data :  resultUpdate, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Mở lại thông báo của một cuộc hội thoại
    unMuteConversation({ conversationID, userID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let listMute =  isMemberInConversation.usersMute;
                let resultUpdate;
                if(!listMute)
                    return resolve({ error: false, message : 'UnMute success', status: 200});

                let newMuteUser = [];
                listMute.forEach(user=>{
                    if(user.user && user.user.toString() !=  userID.toString()){
                        newMuteUser.push(user);
                    }
                });
                resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, { usersMute : newMuteUser })
                
                if(!resultUpdate)
                    return resolve({ error: true, message:'Cant udpate',  status : 403 });

                return resolve({ error: false, data :  resultUpdate });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Pin một cuộc hội thoại
    pinConversation({ conversationID, userID }){
        return new Promise(async(resolve)=>{
            try {

                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let lisPin =  (isMemberInConversation && isMemberInConversation.usersPin ) ||  [];
                for(let i = 0; i<lisPin.length; i++){
                    if(lisPin[i] && lisPin[i].toString() == userID.toString()){
                        return resolve({ error: false, message:  'You pined', status : 200  });
                    }
                }

                let resultUpdate;
                if(lisPin && lisPin.length){

                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        $addToSet: {
                            usersPin: [...userID]
                        }
                    }); 
                }
                if(!lisPin ||(lisPin && !lisPin.length)){
                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        usersPin: [userID]
                    }); 
                }

                if(!resultUpdate)
                    return resolve({ error: true, message: 'Cant pin conversation', status : 403 });

                return resolve({ error: false, data :  resultUpdate, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    //Xoá Pin 1 cuộc hội thoại
    unPinConversation({ conversationID, userID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let lisPin =  isMemberInConversation.usersPin || [];
                
                let isNotePin = true;
                for(let i = 0; i<lisPin.length; i++){
                    if(lisPin[i] && lisPin[i].toString() == userID.toString()){
                        isNotePin = false;
                        break;
                    }
                }
                if(isNotePin)
                    return resolve({ error: false, message:'Removed pin', status : 200 })

                let resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pull: {
                        usersPin: userID
                    }
                }); 
                
                if(!resultUpdate)
                    return resolve({ error: true, message: 'Cant unpin conversation', status : 403 });

                return resolve({ error: false, data :  resultUpdate, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Lấy danh sách pin các cuộc hội thoại
    getListConversationPinByUser(userID){

    }

}

exports.MODEL = new Model;