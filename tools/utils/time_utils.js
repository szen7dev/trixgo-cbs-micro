"use strict";
let moment = require('moment-timezone');

function setTimeZone(date) {
    return moment.tz(date,'Asia/Ho_Chi_Minh');
}
exports.setTimeZone = setTimeZone;
exports.getCurrentTime = function () {
    return setTimeZone(new Date()).format('Y-MM-DD H:m:sZ');
};

exports.parseFormat1 = function (oldTimeFormat) {
    return setTimeZone(oldTimeFormat).format('Y-MM-DD | H:m');
};

exports.parseFormat2 = function (oldTimeFormat) {
    return setTimeZone(oldTimeFormat).format('H:mm DD-MM-Y');
};

exports.parseFormat3 = function (oldTimeFormat) {
    return setTimeZone(oldTimeFormat).format('MM-DD-Y');
};

exports.parseTimeFormat4 = function (oldTimeFormat) {
    return setTimeZone(oldTimeFormat).format('HH:mm DD/MM/Y');
};

exports.parseTimeFormat5 = function (oldTimeFormat) {
    return setTimeZone(oldTimeFormat).format('DD/MM/Y');
};

exports.parseTimeFormatOption = function (oldTimeFormat, format) {
    return setTimeZone(oldTimeFormat).format(format);
};


/**
 * compare time
 * if time1 > time2: return 1
 * if time1 < time2: return 2
 * if time1 = time2: return 0
 * @param time1
 * @param time2
 * @returns {number}
 */
exports.compareTwoTime = function (time1, time2) {
    let a = (new Date(time1)).getTime();
    let b = (new Date(time2)).getTime();
    if (a > b) {
        return 1;
    } else if (b > a) {
        return 2;
    } else {
        return 0;
    }
};

/**
 * Get the number of seconds between two dates
 */
exports.getTimeBetween = function (time1, time2) {
    let a = (new Date(time1)).getTime();
    let b = (new Date(time2)).getTime();
    return (a - b) / (1000);
};

exports.addMinuteToDate = function (dateAdded, minute) {
    return new Date((new Date(dateAdded)).getTime() + minute * 60000);
};

exports.subMinuteToDate = function (subAdded, minute) {
    return new Date((new Date(subAdded)).getTime() - minute * 60000);
};

Date.prototype.addHours = function(h) {
	this.setTime(this.getTime() + (h*60*60*1000));
	return this;
}

Date.prototype.addMinutes = function(m) {
	this.setTime(this.getTime() + (m * 60 * 1000));
	return this;
}