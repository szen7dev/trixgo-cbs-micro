"use strict";

/**
 * Example usage:
 *
 *   node tools/cloudmsg/onesignal.diagnostic.js --app-env cbs --onesignal-id <id>
 *
 *   node tools/cloudmsg/onesignal.diagnostic.js --app-env cbs --onesignal-id <id> --check-status false
 *
 *   node tools/cloudmsg/onesignal.diagnostic.js --app-env cbs --onesignal-id <id> --check-status false --check-delay-ms 1000
 *
 *   node tools/cloudmsg/onesignal.diagnostic.js --app-env cbs --onesignal-id <id> --check-status false --check-delay-ms 1000 --timeout-ms 10000
 *
 *   node tools/cloudmsg/onesignal.diagnostic.js --app-env cbs --onesignal-id <id> --check-status false --check-delay-ms 1000 --timeout-ms 10000 --api-key <key>
 *
 * npm run onesignal:test -- \
  --app-id <YOUR_APP_ID> \
  --api-key "<YOUR_API_KEY>" \
  --onesignal-id <YOUR_ONESIGNAL_ID> \
  --dry-run // bỏ để thực hiện
 */

require("dotenv").config();

const https = require("https");
const { v4: uuidv4 } = require("uuid");

const HOST = "api.onesignal.com";
const SEND_PATH = "/notifications?c=push";
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_STATUS_WAIT_MS = 3000;

const APP_ENV_TO_VAR = {
  cbs: "ONESIGNAL_APP_CBS",
  teaser: "ONESIGNAL_APP_TEASER",
  fnb: "ONESIGNAL_APP_FNB",
  lamin: "ONESIGNAL_APP_LAMIN",
};

function setArg(target, key, value) {
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    if (!Array.isArray(target[key])) {
      target[key] = [target[key]];
    }
    target[key].push(value);
    return;
  }
  target[key] = value;
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const idx = token.indexOf("=");
    if (idx >= 0) {
      const key = token.slice(2, idx);
      const value = token.slice(idx + 1);
      setArg(args, key, value);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith("--")) {
      setArg(args, key, true);
      continue;
    }

    setArg(args, key, next);
    i += 1;
  }

  return args;
}

function toList(value) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  const result = [];

  values.forEach((item) => {
    String(item)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => result.push(entry));
  });

  return result;
}

function getAppId(args) {
  const explicit = args["app-id"];
  if (explicit) {
    return String(explicit).trim();
  }

  const appEnv = args["app-env"];
  if (appEnv) {
    const envKey = APP_ENV_TO_VAR[String(appEnv).trim().toLowerCase()];
    if (!envKey) {
      throw new Error(
        "Invalid --app-env. Use one of: cbs, teaser, fnb, lamin.",
      );
    }
    return (process.env[envKey] || "").trim();
  }

  return (process.env.ONESIGNAL_APP_ID || "").trim();
}

function parseNumber(input, fallback) {
  const value = Number(input);
  if (Number.isNaN(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function parseJsonField(raw, fieldName) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in --${fieldName}: ${error.message}`);
  }
}

function maskSecret(input) {
  if (!input) {
    return "";
  }

  const text = String(input);
  if (text.length <= 8) {
    return "***";
  }

  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function stripWrappingQuotes(input) {
  const value = String(input || "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function stripAuthorizationPrefix(input) {
  return String(input || "")
    .trim()
    .replace(/^authorization\s*:\s*/i, "")
    .trim();
}

function normalizeAuthorizationHeader(apiKey) {
  let value = stripWrappingQuotes(apiKey);
  value = stripAuthorizationPrefix(value);
  value = stripWrappingQuotes(value);

  if (!value) {
    return value;
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("key ") || lower.startsWith("basic ")) {
    return value;
  }

  return `Key ${value}`;
}

function getAuthorizationMeta(authHeader) {
  const raw = String(authHeader || "").trim();
  if (!raw) {
    return { scheme: "none", tokenLength: 0 };
  }

  const parts = raw.split(/\s+/);
  if (parts.length < 2) {
    return { scheme: "unknown", tokenLength: raw.length };
  }

  return { scheme: parts[0], tokenLength: parts.slice(1).join("").length };
}

function shouldCheckStatus(args) {
  const value = args["check-status"];
  if (value === undefined || value === true) {
    return true;
  }
  const normalized = String(value).trim().toLowerCase();
  return !["false", "0", "no"].includes(normalized);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requestJson({ method, path, headers, body, timeoutMs }) {
  const payload = body ? JSON.stringify(body) : "";

  const finalHeaders = Object.assign({}, headers || {});
  if (payload) {
    finalHeaders["Content-Type"] = "application/json";
    finalHeaders["Content-Length"] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const req = https.request(
      {
        hostname: HOST,
        port: 443,
        path,
        method,
        headers: finalHeaders,
      },
      (res) => {
        let responseBody = "";

        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          let parsed = null;
          try {
            parsed = responseBody ? JSON.parse(responseBody) : null;
          } catch (_) {
            parsed = null;
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
            json: parsed,
            durationMs: Date.now() - startedAt,
          });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function printUsage() {
  console.log("");
  console.log("OneSignal push diagnostic script");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node tools/cloudmsg/onesignal.diagnostic.js --app-env cbs --onesignal-id <id>",
  );
  console.log("");
  console.log("Required:");
  console.log(
    "  --app-id <uuid> OR --app-env <cbs|teaser|fnb|lamin> OR env ONESIGNAL_APP_ID",
  );
  console.log("  At least one receiver:");
  console.log("  --onesignal-id <id> (repeatable)");
  console.log("  --onesignal-ids <id1,id2>");
  console.log("  --external-id <id> / --external-ids <id1,id2>");
  console.log("  --player-id <id> / --player-ids <id1,id2>");
  console.log("");
  console.log("Optional:");
  console.log("  --api-key <key> (defaults to env ONESIGNAL_API_KEY)");
  console.log("  --title <text>");
  console.log("  --message <text>");
  console.log('  --data \'{"traceId":"abc"}\'');
  console.log("  --web-url <url>");
  console.log("  --timeout-ms <number> (default 20000)");
  console.log("  --check-status <true|false> (default true)");
  console.log("  --check-delay-ms <number> (default 3000)");
  console.log("  --dry-run");
  console.log("  --help");
  console.log("");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const apiKey = (
    args["api-key"] ||
    process.env.ONESIGNAL_API_KEY ||
    ""
  ).trim();
  const appId = getAppId(args);
  const onesignalIds = [
    ...toList(args["onesignal-id"]),
    ...toList(args["onesignal-ids"]),
  ];
  const externalIds = [
    ...toList(args["external-id"]),
    ...toList(args["external-ids"]),
  ];
  const playerIds = [
    ...toList(args["player-id"]),
    ...toList(args["player-ids"]),
  ];

  if (!apiKey) {
    throw new Error(
      "Missing OneSignal API key. Provide --api-key or set ONESIGNAL_API_KEY.",
    );
  }
  if (!appId) {
    throw new Error(
      "Missing OneSignal app id. Use --app-id, --app-env, or ONESIGNAL_APP_ID.",
    );
  }
  if (!onesignalIds.length && !externalIds.length && !playerIds.length) {
    throw new Error(
      "Missing receiver ids. Use --onesignal-id(s), --external-id(s), or --player-id(s).",
    );
  }

  const extraData = parseJsonField(args.data, "data") || {};
  const title = args.title || "OneSignal Push Diagnostic";
  const message = args.message || `Push test at ${new Date().toISOString()}`;
  const timeoutMs = parseNumber(args["timeout-ms"], DEFAULT_TIMEOUT_MS);
  const checkDelayMs = parseNumber(
    args["check-delay-ms"],
    DEFAULT_STATUS_WAIT_MS,
  );
  const checkStatusEnabled = shouldCheckStatus(args);

  const payload = {
    app_id: appId,
    headings: { en: title },
    contents: { en: message },
    data: Object.assign({}, extraData, {
      diagnostic: true,
      diagnosticAt: new Date().toISOString(),
    }),
    target_channel: "push",
    idempotency_key: args["idempotency-key"] || uuidv4(),
  };

  if (args["web-url"]) {
    payload.web_url = args["web-url"];
  }

  if (onesignalIds.length || externalIds.length) {
    payload.include_aliases = {};
    if (onesignalIds.length) {
      payload.include_aliases.onesignal_id = onesignalIds;
    }
    if (externalIds.length) {
      payload.include_aliases.external_id = externalIds;
    }
  }

  if (playerIds.length) {
    payload.include_player_ids = playerIds;
  }

  const authHeader = normalizeAuthorizationHeader(apiKey);
  const authMeta = getAuthorizationMeta(authHeader);

  console.log("=== OneSignal Diagnostic ===");
  console.log(
    JSON.stringify(
      {
        host: HOST,
        path: SEND_PATH,
        appId,
        apiKey: maskSecret(authHeader),
        authScheme: authMeta.scheme,
        authTokenLength: authMeta.tokenLength,
        onesignalIdsCount: onesignalIds.length,
        externalIdsCount: externalIds.length,
        playerIdsCount: playerIds.length,
        checkStatus: checkStatusEnabled,
      },
      null,
      2,
    ),
  );
  console.log("--- Payload ---");
  console.log(JSON.stringify(payload, null, 2));

  if (args["dry-run"]) {
    console.log("Dry run enabled. Request was not sent.");
    process.exit(0);
  }

  const sendResponse = await requestJson({
    method: "POST",
    path: SEND_PATH,
    headers: {
      Authorization: authHeader,
    },
    body: payload,
    timeoutMs,
  });

  console.log("--- Send Response ---");
  console.log(
    JSON.stringify(
      {
        statusCode: sendResponse.statusCode,
        durationMs: sendResponse.durationMs,
        headers: sendResponse.headers,
        body: sendResponse.json || sendResponse.body,
      },
      null,
      2,
    ),
  );

  if (sendResponse.statusCode >= 400) {
    process.exit(1);
  }

  if (sendResponse.json && sendResponse.json.errors) {
    process.exit(1);
  }

  const notificationId = sendResponse.json && sendResponse.json.id;
  if (!notificationId || !checkStatusEnabled) {
    process.exit(0);
  }

  await sleep(checkDelayMs);

  const statusPath = `/notifications/${encodeURIComponent(
    notificationId,
  )}?app_id=${encodeURIComponent(appId)}`;
  const statusResponse = await requestJson({
    method: "GET",
    path: statusPath,
    headers: {
      Authorization: authHeader,
    },
    timeoutMs,
  });

  console.log("--- Delivery Status Response ---");
  console.log(
    JSON.stringify(
      {
        statusCode: statusResponse.statusCode,
        durationMs: statusResponse.durationMs,
        headers: statusResponse.headers,
        body: statusResponse.json || statusResponse.body,
      },
      null,
      2,
    ),
  );

  if (statusResponse.statusCode >= 400) {
    process.exit(1);
  }

  if (statusResponse.json && statusResponse.json.errors) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("--- OneSignal Diagnostic Error ---");
  console.error(
    JSON.stringify(
      {
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        host: error.hostname,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
