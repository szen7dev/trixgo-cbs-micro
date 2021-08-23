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
    INSERT_CONVERSATION                     		: `${BASE_ROUTE}${CONVERSATION}/create-conversation`,
    UPDATE_CONVERSATION                     		: `${BASE_ROUTE}${CONVERSATION}/update-conversation`,
    ADD_MEMBER_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/add-member-conversation`,
    REMOVE_MEMBER_CONVERSATION              		: `${BASE_ROUTE}${CONVERSATION}/remove-member-conversation`,
	UPDATE_ADMIN_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/update-admin-conversation`,
	UPDATE_CONFIG_CONVERSATION              		: `${BASE_ROUTE}${CONVERSATION}/update-config-conversation`,
	UPDATE_PIN_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/update-pin-conversation`,
	UPDATE_HIDE_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/update-hide-conversation`,
	UPDATE_MUTE_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/update-mute-conversation`,
	MARK_READ_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/mark-read-conversation`,
	MEMBER_LEAVE_CONVERSATION              			: `${BASE_ROUTE}${CONVERSATION}/member-leave-conversation`,
	DELETE_CONVERSATION              				: `${BASE_ROUTE}${CONVERSATION}/delete-conversation`,
	DELETE_HISTORY_CONVERSATION              		: `${BASE_ROUTE}${CONVERSATION}/delete-history-conversation`,

    GET_INFO_CONVERSATION_BY_ID             		: `${BASE_ROUTE}${CONVERSATION}/info-conversation/:conversationID`,
    GET_INFO_GENERAL_GROUP_BY_MEMBER      			: `${BASE_ROUTE}${CONVERSATION}/info-general-group-by-member`,
    GET_LIST_MEMBER_CONVERSATION_BY_ID      		: `${BASE_ROUTE}${CONVERSATION}/list-members-conversation`,
    GET_LIST_MESSAGE_CONVERSATION_WITH_PAGE 		: `${BASE_ROUTE}${CONVERSATION}/list-message-conversation-with-page`,
    GET_LIST_MESSAGE_MEDIA_CONVERSATION 			: `${BASE_ROUTE}${CONVERSATION}/list-message-media-conversation`,
    GET_LIST_MEMBER_SEND_MESSAGE_MEDIA_CONVERSATION : `${BASE_ROUTE}${CONVERSATION}/list-member-send-message-media-conversation`,


	// Author VINHVH
    GET_LIST_CONVERSATION_BY_USER_ID        : `${BASE_ROUTE}${CONVERSATION}/users/:userID`,
    GET_LIST_CONVERSATION_BY_KEY            : `${BASE_ROUTE}${CONVERSATION}`,
    GET_LIST_CONVERSATION_LINK_BY_ID        : `${BASE_ROUTE}${CONVERSATION}/links/:conversationID`,
    GET_LIST_CONVERSATION_MISS_BY_USER_ID   : `${BASE_ROUTE}${CONVERSATION}/miss`,
    GET_LIST_CONVERSATION_FILE_BY_ID        : `${BASE_ROUTE}${CONVERSATION}/files/:conversationID`,

    // MESSAGE
	INSERT_MESSAGE_CONVERSATION              		: `${BASE_ROUTE}${CONVERSATION}/insert-message-conversation`,
	DELETE_MESSAGE_CONVERSATION              		: `${BASE_ROUTE}${CONVERSATION}/delete-message-conversation`,
	REVOKE_MESSAGE_CONVERSATION              		: `${BASE_ROUTE}${CONVERSATION}/revoke-message-conversation`,
    SEARCH_MESSAGE_CONVERSATION_BY_ID 				: `${BASE_ROUTE}${CONVERSATION}/search-message-conversation-by-id`,


    GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/:conversationID`,

    // ======================== SWAGGER - DOC ===============================

    // CONVERSATION
    SWAGGER_GET_LIST_CONVERSATION_BY_USER_ID    : `${BASE_ROUTE}${CONVERSATION}/users/{userID}`,
    SWAGGER_GET_INFO_CONVERSATION_BY_ID         : `${BASE_ROUTE}${CONVERSATION}/{conversationID}`,

    // MESSAGE
    SWAGGER_GET_LIST_MESSAGE_BY_CONVERSATION_ID : `${BASE_ROUTE}${MESSAGE}/conversations/{conversationID}`
}

exports.CF_ROUTINGS_CHATTING = CF_ROUTINGS_CHATTING;