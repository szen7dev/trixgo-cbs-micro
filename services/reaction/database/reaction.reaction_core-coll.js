"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("reaction_core", {
    /**
     * Loại tương tác, like, tim, haha ...
     *  { value: 1, text: 'Thả tim', image: '2764.png' },
        { value: 2, text: 'Cười sặc sụa', image: '1f606.png' },
        { value: 3, text: 'Ngạc nhiên', image: '1f62e.png' },
        { value: 4, text: 'Buồn thương', image: '1f622.png' },
        { value: 5, text: 'Giận dữ', image: '1f620.png' },
        { value: 6, text: 'Thích', image: '1f44d.png' },
        { value: 7, text: 'Không thích', image: '1f44e.png' },
     */
    type: {
        type: Number,
        default: 1
    },
    
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : "user"                  
    },
})