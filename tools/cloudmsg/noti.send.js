
exports.sendNotificationviaCloudMessaging = function(data) {
   console.log({
    sendNotificationviaCloudMessaging: data
   })
    let headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "NDFlZGFiOTMtYjM1My00ZWIyLTg4MmItYmNhMTBiMGUxYjQz"
    };
    
    let options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    let https = require('https');
    let req = https.request(options, function(res) {  
        res.on('data', function(data) {
            console.log("Response:");
            console.log(JSON.parse(data));
        });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
};
  
// let message = { 
//     app_id: "79acfc09-966a-48f5-a9ea-44d90410014f",
//     contents: {"en": "English Message"},
//     headings: {"en": "HEADING ENGLISH"},
//     include_player_ids: ["e45cef35-de34-4a85-b7f4-6dab8ed41be0"],
//     big_picture: 'https://trixgo.com/template/images/logo.png'
// };

// sendNotificationviaCloudMessaging(message)