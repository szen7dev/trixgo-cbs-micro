/**
 * Constants
 */
const { EVENT_SOCKET_CONSTANT_FNB }		        = require('./helper/fnb.events-socket-constant');
const { CF_DOMAIN_SERVICES }                    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 						= require('../auth/helper/auth.actions-constant');
const { CF_ACTIONS_ITEM }                       = require('../item/helper/item.actions-constant');

/**
 * Utils
 */
const { sendDataToMultilSocketsOfListUser } 	= require('../../tools/socket');
const { ENV_DEVICE_APP_FNB } 				    = require('../notification/helper/notification.keys-constant');

exports.FNB_SOCKET = {

    /**
     * Tạo mới đơn hàng
     */
    [EVENT_SOCKET_CONSTANT_FNB.FNB_CSS_ADD_NEW_ORDER]: async function(data) {
        try {
            let socket                          = this;
			let broker                          = socket.$service.broker;
            let listUserActive                  = socket.$service.listUserConnected;
            let userID                          = socket.client.user;
            let io                              = socket.$service.io;
            let { companyID, fundaID, orderInfo } = data;
            console.log({ 'EVENT_SOCKET_CONSTANT_FNB.FNB_CSS_ADD_NEW_ORDER': data });

            if(!companyID){
                return sendDataToMultilSocketsOfListUser({
                    listUserConnected: listUserActive,
                    arrReceiver: [userID],
                    data: { error: true, message: "Tham số companyID không hợp lệ" },
                    event: [EVENT_SOCKET_CONSTANT_FNB.FNB_SSC_ADD_NEW_ORDER], io
                });
            }

            // let fundaResponse = await broker.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`, {
            //     fundaID
            // }, {
            //     meta: {
            //         infoUser: { _id: userID, company: { _id: companyID } }
            //     }
            // });
            // console.log({ fundaResponse, fundaID })
            // if(!fundaResponse || fundaResponse.error) {
            //     return sendDataToMultilSocketsOfListUser({
            //         listUserConnected: listUserActive,
            //         arrReceiver: [userID],
            //         data: { error: true, message: "Tham số fundaID không hợp lệ" },
            //         event: [EVENT_SOCKET_CONSTANT_FNB.FNB_SSC_ADD_NEW_ORDER], io
            //     });
            // }

            const user = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
                userID,
                select: '_id bizfullname'
            });
            if(!user || user.error) {
                return sendDataToMultilSocketsOfListUser({
                    listUserConnected: listUserActive,
                    arrReceiver: [userID],
                    data: { error: true, message: "Tham số userID không hợp lệ" },
                    event: [EVENT_SOCKET_CONSTANT_FNB.FNB_SSC_ADD_NEW_ORDER], io
                });
            }

            const users = await broker.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
                companyID, //fundaResponse?.data?.company?.toString(),
                isLoadAll: true,
            });
            console.log({ users })
            if(!users || users.error) {
                return sendDataToMultilSocketsOfListUser({
                    listUserConnected: listUserActive,
                    arrReceiver: [userID],
                    data: { error: true, message: "Tham số company không hợp lệ" },
                    event: [EVENT_SOCKET_CONSTANT_FNB.FNB_SSC_ADD_NEW_ORDER], io
                });
            }

            const usersID = users.data?.map(user => user._id);
            const receivers = usersID.filter(receiverID => receiverID.toString() !== userID.toString());
            const titleMSS = `Đơn hàng ${fundaResponse?.data?.name}`;
            const contentMSS = `Đơn hàng ${orderInfo?.name}, mã hiệu ${orderInfo?.sign}, giá trị ${orderInfo?.total}, đã được thanh toán thành công bởi ${user.data?.bizfullname}`;
            console.log({ usersID, receivers })

            // Cloud messaging
            broker.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
				users: receivers,
				title: titleMSS,
				description: contentMSS,
				dataSend: {
                    orderID: orderInfo?._id,
				},
				web_url: ``,
				env: ENV_DEVICE_APP_FNB
			});

            // Socket
            sendDataToMultilSocketsOfListUser({
                listUserConnected: listUserActive,
                arrReceiver: receivers,
                data: {
                    error: false,
                    data: {
                        orderID: orderInfo._id,
                    }
                }, event: [EVENT_SOCKET_CONSTANT_FNB.FNB_SSC_ADD_NEW_ORDER], io
            });
        } catch (error) {
            console.info('======EVENT_SOCKET_CONSTANT_FNB.FNB_SSC_ADD_NEW_ORDER=====');
            console.error(error);
        }
    },
}