"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_doc_comment", {
    // message_conversation
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'reaction_comment'
    },
    

   
})