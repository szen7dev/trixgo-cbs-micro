const BASE_ROUTE = '/chatting';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const CONVERSATION = '/conversations';
const MESSAGE      = '/messages';

const CF_ROUTINGS_CHATTING = {
    ORIGIN_APP: BASE_ROUTE,

    // CONVERSATION
    INSERT_CONVERSATION                     : `${BASE_ROUTE}${CONVERSATION}`, // chatting/conversations
    GET_LIST_CONVERSATION_BY_USER_ID        : `${BASE_ROUTE}${CONVERSATION}/users/:userID`, // chatting/conversations/users/:userID
    GET_INFO_CONVERSATION_BY_ID             : `${BASE_ROUTE}${CONVERSATION}/:conversationID`, // chatting/conversations/:conversationID GET, PUT, DELETE
    GET_LIST_MEMBER_CONVERSATION_BY_ID      : `${BASE_ROUTE}${CONVERSATION}/members/:conversationID`, // chatting/conversations/:conversationID GET, PUT, DELETE
    GET_LIST_CONVERSATION_BY_KEY            : `${BASE_ROUTE}${CONVERSATION}`, // chatting/conversation/?key=abc&key2=2
    GET_INFO_CONVERSATION_DRAFT             : `${BASE_ROUTE}${CONVERSATION}/draft/:conversationID`, // chatting/conversations/?key=abc&key2=2
    GET_LIST_CONVERSATION_LINK_BY_ID        : `${BASE_ROUTE}${CONVERSATION}/links/:conversationID`, // chatting/conversations/?key=abc&key2=2
    GET_LIST_CONVERSATION_MISS_BY_USER_ID   : `${BASE_ROUTE}${CONVERSATION}/miss`, // chatting/conversation/?key=abc&key2=2
    GET_LIST_CONVERSATION_FILE_BY_ID        : `${BASE_ROUTE}${CONVERSATION}/files/:conversationID`, // chatting/conversations/?key=abc&key2=2


    // MESSAGE
    GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/:conversationID`,

    // ======================== SWAGGER - DOC ===============================
    // *** CONVERSATION ***
	// /message/conversations/users/:userID
    SWAGGER_GET_LIST_CONVERSATION_BY_USER_ID    : `${BASE_ROUTE}${CONVERSATION}/users/{userID}`,
	// /messsage/conversation/:conversationID GET, PUT, DELETE
    SWAGGER_GET_INFO_CONVERSATION_BY_ID         : `${BASE_ROUTE}${CONVERSATION}/{conversationID}`,

    // MESSAGE
    SWAGGER_GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/{conversationID}`
}

exports.CF_ROUTINGS_CHATTING = CF_ROUTINGS_CHATTING;