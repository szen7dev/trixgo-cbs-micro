const BASE_ROUTE = '/document';

const CF_ROUTINGS_DOCUMENT = {
	// ======================== ROUTE - API ===============================

    /// DOCUMENT
    INSERT_DOCUMENT                     		: `${BASE_ROUTE}/insert-document`,
    UPDATE_DOCUMENT                     		: `${BASE_ROUTE}/update-document`,
    DELETE_DOCUMENT                     		: `${BASE_ROUTE}/delete-document`,
    GET_INFO_DOCUMENT                     		: `${BASE_ROUTE}/info-document`,
    GET_LIST_DOCUMENT                     		: `${BASE_ROUTE}/list-document`,
    GET_LIST_STORAGE                     		: `${BASE_ROUTE}/list-storage`,
    MARK_DOCUMENT                     		    : `${BASE_ROUTE}/mark-document`,
    SHARE_DOCUMENT                     		    : `${BASE_ROUTE}/share-document`,
    UPDATE_PERMISSION_SHARE                     : `${BASE_ROUTE}/update-permission-share`,
    ADD_FILE_ATTACHMENT                         : `${BASE_ROUTE}/add-file-attachment`,
    GET_LIST_USER_SHARED                        : `${BASE_ROUTE}/list-user-shared`,

    /// PACKAGE
    DOCUMENT_PACKAGE                     		: `${BASE_ROUTE}/document_packages`,

    /// DOC_TYPE
    GET_LIST_DOCTYPE                     		: `${BASE_ROUTE}/list-doctype`,
    GET_LIST_GROUP_DOCTYPE            		    : `${BASE_ROUTE}/list-group-doctype`,
}

exports.CF_ROUTINGS_DOCUMENT = CF_ROUTINGS_DOCUMENT;
