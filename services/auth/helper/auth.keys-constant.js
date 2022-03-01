exports.PLATFORM_TRIXGO = 1;
exports.PLATFORM_WYNDIX = 2;

exports.LEVEL_ADMIN         = 100;
exports.LEVEL_USER_OWNER    = 0;
exports.LEVEL_USER_EMPLOYEE = 1;

exports.STATUS_ACTIVE       = 1;
exports.STATUS_INACTIVE     = -1;
exports.STATUS_BLOCK        = 0;

/**
 * Danh sách mapping DOMAIN - PLATFORM
 */
exports.validateDomainAndPlatform = [
    {
        domain: "https://staging.cbs.trixgo.com",
        platform: 1
    },
    {
        domain: "https://staging.wdx.trixgo.com",
        platform: 2
    },
];

