"use strict";

/**
 * TẦNG PHỤC VỤ FILE CÓ XÁC THỰC
 * ------------------------------------------------------------------
 * Bucket DO Spaces đã chuyển sang private, không còn ai cầm URL là tải được.
 * Middleware này là cửa duy nhất để đọc file:
 *
 *   POST   /api/files/session      -> đổi Bearer token lấy cookie file (HttpOnly)
 *   DELETE /api/files/session      -> xoá cookie file (khi logout)
 *   GET    /api/files/s3/<key>     -> xác thực rồi 302 sang link ký có hạn
 *
 * Vì sao cần cookie: thẻ <img src="...">, <a href download>, window.open đều
 * không gắn được header Authorization. Cookie đặt ở domain cha (.trixgo.com)
 * nên trình duyệt tự kèm theo cho mọi request sang api.trixgo.com — nhờ đó FE
 * chỉ cần đổi biến môi trường, không phải sửa hàng trăm chỗ render ảnh/file.
 *
 * Middleware chạy ở tầng express (settings.use) nên nằm TRƯỚC toàn bộ routing
 * của moleculer-web: các route cũ giữ nguyên hành vi, không đụng tới CORS chung.
 */

const cookie = require("cookie");

const { verify } = require("../../../tools/jwt");
const { GET_SIGNED_DOWNLOAD_URL } = require("../../file/helper/s3");
const { CF_DOMAIN_SERVICES } = require("../helper/domain.constant");
const { CF_ACTIONS_AUTH } = require("../../auth/helper/auth.actions-constant");

const FILE_PROXY_PREFIX = "/api/files/s3/";
const FILE_SESSION_PATH = "/api/files/session";

const COOKIE_NAME = process.env.FILE_COOKIE_NAME || "tx_file";
const COOKIE_DOMAIN = process.env.FILE_COOKIE_DOMAIN || "";
const COOKIE_SAME_SITE = process.env.FILE_COOKIE_SAME_SITE || "lax";
const COOKIE_SECURE = process.env.FILE_COOKIE_SECURE !== "false";
const COOKIE_MAX_AGE = Number(process.env.FILE_COOKIE_MAX_AGE || 7 * 24 * 60 * 60);

// Trình duyệt được nhớ lại kết quả redirect trong bấy nhiêu giây (giảm số lần ký link)
const REDIRECT_CACHE_SECONDS = Number(process.env.FILE_REDIRECT_CACHE_SECONDS || 60);
// Token đăng nhập hiện không có hạn -> vẫn phải soi lại trạng thái user, nhưng có cache
const USER_STATUS_TTL_MS = Number(process.env.FILE_USER_STATUS_TTL_MS || 60 * 1000);
const USER_STATUS_CACHE_LIMIT = 5000;

const userStatusCache = new Map();

/**
 * Trả về true nếu user còn được phép dùng hệ thống.
 * Kết quả cache ngắn hạn vì một trang có thể bắn hàng chục request ảnh cùng lúc.
 */
const isUserActive = async (broker, userID) => {
    const cached = userStatusCache.get(userID);
    if (cached && cached.expiredAt > Date.now()) return cached.active;

    let active = true;
    try {
        const result = await broker.call(
            `${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`,
            { userID, select: "status" }
        );

        // Không tìm thấy user hoặc user bị khoá -> chặn
        if (result?.error) active = false;
        else if (result?.data?.status === 0) active = false;
    } catch (error) {
        // Auth service trục trặc: không chặn oan người đang dùng, chỉ ghi log
        broker.logger.warn("[file-access] không kiểm tra được trạng thái user:", error.message);
        return true;
    }

    if (userStatusCache.size >= USER_STATUS_CACHE_LIMIT) userStatusCache.clear();
    userStatusCache.set(userID, { active, expiredAt: Date.now() + USER_STATUS_TTL_MS });

    return active;
}

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const [type, value] = authHeader.split(" ");
        if (["Token", "Bearer", "OAuth"].includes(type) && value) return value;
    }

    if (req.headers.cookie) {
        const cookies = cookie.parse(req.headers.cookie);
        if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
    }

    return null;
}

const buildCookie = (token) => cookie.serialize(COOKIE_NAME, token || "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge: token ? COOKIE_MAX_AGE : 0,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
});

/**
 * Tự set CORS cho riêng các endpoint ở đây: response do middleware này trả thẳng,
 * không đi qua CORS chung của moleculer-web. Phải echo đúng origin (không dùng "*")
 * thì trình duyệt mới chịu lưu cookie.
 */
const writeCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    if (!origin) return;

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With");
    res.setHeader("Vary", "Origin");
}

const sendJson = (res, statusCode, body) => {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
}

/**
 * Bóc key S3 từ URL. Chặn mọi mưu toan đi ngược thư mục.
 */
const extractKey = (pathname) => {
    const raw = pathname.slice(FILE_PROXY_PREFIX.length);
    if (!raw) return null;

    let key;
    try {
        key = decodeURIComponent(raw);
    } catch (error) {
        return null;
    }

    key = key.replace(/^\/+/, "");
    if (!key || key.includes("..")) return null;

    return key;
}

/**
 * @param {Function} getBroker Hàm trả về broker của gateway (gán lúc service created)
 */
const createFileAccessMiddleware = (getBroker) => {
    return function fileAccessMiddleware(req, res, next) {
        const pathname = (req.url || "").split("?")[0];

        const isSession = pathname === FILE_SESSION_PATH;
        const isProxy = pathname.startsWith(FILE_PROXY_PREFIX);

        if (!isSession && !isProxy) return next();

        writeCorsHeaders(req, res);

        if (req.method === "OPTIONS") {
            res.statusCode = 204;
            return res.end();
        }

        const broker = getBroker();
        if (!broker) return sendJson(res, 503, { error: true, message: "service_not_ready" });

        //---------------------- ĐỔI TOKEN LẤY COOKIE ----------------------//
        if (isSession) {
            if (req.method === "DELETE") {
                res.setHeader("Set-Cookie", buildCookie(null));
                return sendJson(res, 200, { error: false, message: "file_session_cleared" });
            }

            if (req.method !== "POST") {
                return sendJson(res, 405, { error: true, message: "method_not_allowed" });
            }

            const token = getTokenFromRequest(req);
            if (!token) return sendJson(res, 401, { error: true, message: "Unauthorized" });

            return verify(token)
                .then(async decoded => {
                    const userID = decoded?.infoUser?._id;
                    if (!userID) return sendJson(res, 401, { error: true, message: "Unauthorized" });

                    if (!(await isUserActive(broker, String(userID)))) {
                        return sendJson(res, 403, { error: true, message: "user_blocked" });
                    }

                    res.setHeader("Set-Cookie", buildCookie(token));
                    return sendJson(res, 200, { error: false, message: "file_session_created" });
                })
                .catch(() => sendJson(res, 401, { error: true, message: "Unauthorized" }));
        }

        //---------------------- PHỤC VỤ FILE ----------------------//
        if (!["GET", "HEAD"].includes(req.method)) {
            return sendJson(res, 405, { error: true, message: "method_not_allowed" });
        }

        const key = extractKey(pathname);
        if (!key) return sendJson(res, 400, { error: true, message: "file_key_invalid" });

        const token = getTokenFromRequest(req);
        if (!token) return sendJson(res, 401, { error: true, message: "Unauthorized" });

        return verify(token)
            .then(async decoded => {
                const userID = decoded?.infoUser?._id;
                if (!userID) return sendJson(res, 401, { error: true, message: "Unauthorized" });

                if (!(await isUserActive(broker, String(userID)))) {
                    return sendJson(res, 403, { error: true, message: "user_blocked" });
                }

                const query = new URLSearchParams((req.url.split("?")[1] || ""));
                const downloadName = query.get("download");

                const signedUrl = await GET_SIGNED_DOWNLOAD_URL({
                    key,
                    fileName: downloadName || undefined,
                });

                res.statusCode = 302;
                res.setHeader("Location", signedUrl);
                res.setHeader("Cache-Control", `private, max-age=${REDIRECT_CACHE_SECONDS}`);
                return res.end();
            })
            .catch(error => {
                broker.logger.warn("[file-access] từ chối phục vụ file:", key, error.message);
                return sendJson(res, 401, { error: true, message: "Unauthorized" });
            });
    };
}

module.exports = {
    createFileAccessMiddleware,
    FILE_PROXY_PREFIX,
    FILE_SESSION_PATH,
    COOKIE_NAME,
};
