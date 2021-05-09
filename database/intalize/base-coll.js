"use strict";

let mongoose            = require('mongoose');
var Schema = require('mongoose').Schema;
var random = require('mongoose-simple-random');

module.exports = function (dbName, dbOb) {
    // dbOb.createAt = Date;
    // dbOb.modifyAt = Date;
    let s = new Schema(dbOb, {
        timestamps: true
    });
    // s.set('timestamps', {
    //     createAt: 'crdAt',
    //     modifyAt: 'updAt',
    // })
    s.plugin(random);
    return mongoose.model(dbName, s);
};