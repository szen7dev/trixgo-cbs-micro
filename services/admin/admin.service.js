"use strict";
const { CF_DOMAIN_SERVICES }        = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_ADMIN }          = require('./helper/admin.actions-constant');

const ADMIN__BACKUP_HANDLER         = require('./handler/admin.backup-handler');

/**
 * QUẢN TRỊ HỆ THỐNG.
 *
 * ⚠️ KHÔNG khai `DbService` mixin — service này không sở hữu collection nào. Nó đọc kho sao lưu
 * ở ngoài (DO Spaces) và mượn `auth` để chốt quyền. Gắn thêm mixin cho "giống các service khác"
 * là dựng một collection rỗng không ai ghi, và người sau sẽ mất thời gian đi tìm xem nó chứa gì.
 */
module.exports = {
    name: CF_DOMAIN_SERVICES.ADMIN,

    /**
    * Service metadata
    */
    metadata: {

    },

    /**
    * Service dependencies
    */
    dependencies: [],

    /**
    * Actions
    */
    actions: {
        //==========================================   SAO LƯU CSDL   ================================
        [CF_ACTIONS_ADMIN.BACKUP_GET_LIST]      : ADMIN__BACKUP_HANDLER.getList,
        [CF_ACTIONS_ADMIN.BACKUP_GET_URL]       : ADMIN__BACKUP_HANDLER.getDownloadUrl,
    },

    /**
    * Events
    */
    events: {
    },

    /**
    * Methods
    */
    methods: {
    },
};
