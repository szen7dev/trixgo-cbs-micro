const BASE_ROUTE = '/crm';

const CF_ROUTINGS_CRM = {
    // ==================== CRM_GROW_TRACK ======================== //
    CRM_GROW_TRACK                              : `${BASE_ROUTE}/grow_track`,
    CRM_GROW_TRACK_GET_LIST_BY_PROPERTY         : `${BASE_ROUTE}/grow_track/get-list-by-property`,
    CRM_GROW_TRACK_EXPORT_EXCEL                 : `${BASE_ROUTE}/grow_track/export-excel`,

    // ==================== CRM_SURVEY ======================== //
    CRM_SURVEY                                  : `${BASE_ROUTE}/survey`,
    CRM_SURVEY_GET_LIST_BY_PROPERTY             : `${BASE_ROUTE}/survey/get-list-by-property`,
    CRM_SURVEY_EXPORT_EXCEL                     : `${BASE_ROUTE}/survey/export-excel`,

    // ==================== CRM_SURVEY_RESULT ======================== //
    CRM_SURVEY_RESULT                           : `${BASE_ROUTE}/survey_result`,
    CRM_SURVEY_RESULT_GET_LIST_BY_PROPERTY      : `${BASE_ROUTE}/survey_result/get-list-by-property`,
    CRM_SURVEY_RESULT_EXPORT_EXCEL              : `${BASE_ROUTE}/survey_result/export-excel`,
}

exports.CF_ROUTINGS_CRM = CF_ROUTINGS_CRM;