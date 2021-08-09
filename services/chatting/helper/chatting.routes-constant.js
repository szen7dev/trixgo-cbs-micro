const BASE_ROUTE = '/chatting';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const CONVERSATION = '/conversations';
const MESSAGE      = '/messages';

const CF_ROUTINGS_CHATTING = {
    ORIGIN_APP: BASE_ROUTE,

	// ======================== ROUTE - API ===============================

    // CONVERSATION
    INSERT_CONVERSATION                     : `${BASE_ROUTE}${CONVERSATION}/create-conversation`,
    UPDATE_CONVERSATION                     : `${BASE_ROUTE}${CONVERSATION}/update-conversation`,
    ADD_MEMBER_CONVERSATION              	: `${BASE_ROUTE}${CONVERSATION}/add-member-conversation`,
    REMOVE_MEMBER_CONVERSATION              : `${BASE_ROUTE}${CONVERSATION}/remove-member-conversation`,
	UPDATE_ADMIN_CONVERSATION              	: `${BASE_ROUTE}${CONVERSATION}/update-admin-conversation`,
	UPDATE_CONFIG_CONVERSATION              : `${BASE_ROUTE}${CONVERSATION}/update-config-conversation`,

    GET_LIST_CONVERSATION_BY_USER_ID        : `${BASE_ROUTE}${CONVERSATION}/users/:userID`,
    GET_INFO_CONVERSATION_BY_ID             : `${BASE_ROUTE}${CONVERSATION}/:conversationID`,
    GET_LIST_MEMBER_CONVERSATION_BY_ID      : `${BASE_ROUTE}${CONVERSATION}/members/:conversationID`,
    GET_LIST_CONVERSATION_BY_KEY            : `${BASE_ROUTE}${CONVERSATION}`,
    GET_INFO_CONVERSATION_DRAFT             : `${BASE_ROUTE}${CONVERSATION}/draft/:conversationID`,
    GET_LIST_CONVERSATION_LINK_BY_ID        : `${BASE_ROUTE}${CONVERSATION}/links/:conversationID`,
    GET_LIST_CONVERSATION_MISS_BY_USER_ID   : `${BASE_ROUTE}${CONVERSATION}/miss`,
    GET_LIST_CONVERSATION_FILE_BY_ID        : `${BASE_ROUTE}${CONVERSATION}/files/:conversationID`,

    // MESSAGE
    GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/:conversationID`,

    // ======================== SWAGGER - DOC ===============================

    // CONVERSATION
    SWAGGER_GET_LIST_CONVERSATION_BY_USER_ID    : `${BASE_ROUTE}${CONVERSATION}/users/{userID}`,
    SWAGGER_GET_INFO_CONVERSATION_BY_ID         : `${BASE_ROUTE}${CONVERSATION}/{conversationID}`,

    // MESSAGE
    SWAGGER_GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/{conversationID}`
}

exports.CF_ROUTINGS_CHATTING = CF_ROUTINGS_CHATTING;