const BASE_ROUTE = '/chatting';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
 const CONVERSATION = '/conversations',
 MESSAGE            = '/messages';

const CF_ROUTINGS_CHATTING = {
    ORIGIN_APP: BASE_ROUTE,

    // CONVERSATION
    INSERT_CONVERSATION                 : `${BASE_ROUTE}${CONVERSATION}`, //message/conversations
    GET_LIST_CONVERSATION_BY_USER_ID    : `${BASE_ROUTE}${CONVERSATION}/users/:userID`, //message/conversations/users/:userID
    GET_INFO_CONVERSATION_BY_ID         : `${BASE_ROUTE}${CONVERSATION}/:conversationID`, //messsage/conversation/:conversationID GET, PUT, DELETE
    GET_LIST_CONVERSATION_BY_KEY        : `${BASE_ROUTE}${CONVERSATION}`, //messsage/conversation/?key=abc&key2=2

    // MESSAGE
    GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/:conversationID`,
}

exports.CF_ROUTINGS_CHATTING = CF_ROUTINGS_CHATTING;