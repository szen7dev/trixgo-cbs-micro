"use strict";

let mongoose            = require('mongoose');
let Schema              = require('mongoose').Schema;
let random              = require('mongoose-simple-random');

module.exports = function (dbName, dbOb) {
    dbOb.createAt = Date;
    dbOb.modifyAt = Date;
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