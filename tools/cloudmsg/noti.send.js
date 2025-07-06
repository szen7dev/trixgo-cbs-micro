
// https://documentation.onesignal.com/reference/push-notification

exports.sendNotificationviaOneSignal = function (data) {
  console.log({ env: process.env.NODE_ENV });
  if (process.env.NODE_ENV === "development") {
    return;
  }

  let headers = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: "OGE2ZTEwNzAtYzY5MC00YjBjLTk3ZGItMTQzNGM4ZjM1YjYw",
  };

  let options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers,
  };

  let https = require("https");
  let req = https.request(options, function (res) {
    res.on("data", function (data) {
      try {
        console.log("Response:", data);
        // console.log(JSON.parse(data));
      } catch (error) {
        console.error(error);
      }
    });
  });

  req.on("error", function (e) {
    console.error("ERROR: (noti.send.js)");
    console.error(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

exports.sendNotificationviaOneSignalV2 = (data) => {
  const payload = JSON.stringify(data);
  console.log("OneSignal Payload: ", payload)

  const options = {
    hostname: "api.onesignal.com",
    port: 443,
    path: "/notifications?c=push",
    method: "POST",
    headers: {
      Authorization: (process.env.ONESIGNAL_API_KEY || "").trim(),
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const https = require("https");
  const req = https.request(options, function (res) {
    let responseBody = "";

    res.on("data", function (chunk) {
      responseBody += chunk;
    });

    res.on("end", function () {
      console.log("OneSignal Response:", responseBody);
      // try {
      //   const parsedData = JSON.parse(responseBody);
      //   console.log("OneSignal Response:", parsedData);
      // } catch (error) {
      //   console.error("OneSignal error parsing response:", error);
      // }
    });
  });

  req.on("error", function (e) {
    console.error("OneSignal ERROR: (noti.send.js)");
    console.error(e);
  });

  req.write(payload);
  req.end();
};

// let message = {
//     // app_id: "79acfc09-966a-48f5-a9ea-44d90410014f",
//     app_id: "bb20e3c3-e4b2-458a-b8e0-35955876073f",
//     contents: {"en": "English Message"},
//     headings: {"en": "HEADING ENGLISH"},
//     include_player_ids: ["0840a5a3-3e0b-4439-838e-fb13ba6c48ce"],
//     big_picture: 'https://trixgo.com/template/images/logo.png'
// };

// sendNotificationviaOneSignal(message)
