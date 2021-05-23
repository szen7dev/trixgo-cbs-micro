"use strict";

exports.isEmpty = function (value) {
    return typeof value == 'string'
        && !value.trim()
        || typeof value == 'undefined'
        || value === null
        || value == undefined;
};

exports.isEmptyObject = function (obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
};

/**
 * kiểm tra mảng array có tồn tại giá trị hay không?
 * @param params
 * @returns {boolean}
 */
exports.checkParamsValidate = function (params) {
    var isParamIsValidate = true;
    params.forEach(function (item, index) {
        if (item == null || item.trim().length == 0) {
            isParamIsValidate = false;
        }
    });

    return isParamIsValidate;
};

exports.randomIntBetween = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

exports.randomIntFromInterval = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

function change_alias(alias) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    str = str.replace(/ + /g, " ");
    str = str.trim();
    return str;
}
/**
 * Hàm chuyển đổi từ name sang slug
 * @param {*} plainText
 * @returns {string} 
 */
exports.convertToSlug = function (plainText) {
    const text_converted_alias = change_alias(plainText);
    const text_split_with_space = text_converted_alias.split(' ');
    const text_joined = text_split_with_space.join('-');
    return text_joined;
}

exports.filterObject = (obj, filter, filterValue) =>
    Object.keys(obj).reduce((acc, val) =>
        (obj[val][filter] === filterValue ? {
            ...acc,
            [val]: obj[val]
        } : acc
        ), {});

/**
 * param: email
 * return bolean
 */
exports.checkEmail = email => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * param: price
 * return number
 */
exports.checkNumber = price => {
    var re = /^[0-9]*$/;
    return re.test(price);
}

/* 
 * Hàm validation các kí tự thực thi script 
 * param: data
 * return boolean
*/
exports.isValidationData = data => {
    const denineString = ['<', '>', '\'', '\"', '&', '\\', '\\\\'];
    const dataAfterSplited = data.split('');
    let temp = 0;
    while (temp < dataAfterSplited.length) {
        if (dataAfterSplited.includes(denineString[temp])) {
            return false;
        }
        temp++;
    }
    return true;
}


let formatCurrentcy = x => {
    x = x.toLocaleString('it-IT', { style: 'currency', currency: 'VND' });
    return x;
};

exports.formatCurrentcy = formatCurrentcy;
 
exports.checkRangeValid = (arr, val) => {
    if (!Array.isArray(arr) || !arr.includes(val))
        return false;
    return true;
}

/**
 * Tính số ngày giữa 2 ngày
 * Author: DEPV
*/
exports.numberOfNightsBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate) //clone
    const end = new Date(endDate) //clone
    let dayCount = 0
  
    while (end > start) {
      dayCount++
      start.setDate(start.getDate() + 1)
    }
  
    return dayCount
}


let _isValid = input => {
    if (!input)
        return false;
    let inputForCheck = input.toString();
    if (ObjectID.isValid(input.toString())) {
        if (String(new ObjectID(input)) === inputForCheck) 
            return true;
        return false;
    }
    return false;
}
exports._isValid = _isValid;
/**
 * 
 * @param  {...any} params 
 * @returns 
 * 
 * -------cách dùng----------
 *  if (!checkObjectIDs(authorID, companyID, projectID)){
 *  ...
    }
 */
exports.checkObjectIDs = (...params) => {
    let flag = true;
    let arrParams = lodash.flattenDeep(params);
    for(let i = 0; i < arrParams.length; i++) {
        if (!_isValid(arrParams[i]))
            return flag = false
    }
    return flag;
}
