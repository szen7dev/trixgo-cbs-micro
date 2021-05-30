const BASE_ROUTE = '/message';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
 const CONVERSATION = '/conversation',
 MESSAGE            = '/message';

const CF_ROUTINGS_CHATTING = {
    ORIGIN_APP: BASE_ROUTE,

    // CONVERSATION
    INSERT_CONVERSATION                 : `${BASE_ROUTE}${CONVERSATION}/insert`,
    GET_LIST_CONVERSATION_BY_USER_ID    : `${BASE_ROUTE}${CONVERSATION}/getListConversationByUserId`,
    GET_INFO_CONVERSATION_BY_ID         : `${BASE_ROUTE}${CONVERSATION}/getListConversationById`,
    GET_LIST_CONVERSATION_BY_KEY        : `${BASE_ROUTE}${CONVERSATION}/getListConversationByKey`,


    // MESSAGE
    GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/getListMessageByConversationId`,


}

exports.CF_ROUTINGS_CHATTING = CF_ROUTINGS_CHATTING;