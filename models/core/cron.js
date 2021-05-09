const CRON_COLL = require('../../database/test/cron_coll');

module.exports = class Product extends CRON_COLL {
    static createCron( minute ,
        hours ,
        dayOfMonth ,
        month ,
        dayOfWeek,
        authorID
        ) {
        return new Promise(async resolve => {
            try {

                let dataInsert = { 
                    minute ,
                    hours ,
                    dayOfMonth ,
                    month ,
                    dayOfWeek,
                    author: authorID
                };
                let infoAfterInsert = new CRON_COLL(dataInsert);
                let saveDataInsert = await infoAfterInsert.save();
                if (!saveDataInsert) return resolve({ error: true, message: 'cannot_insert_cron' });

                resolve({ error: false, data: infoAfterInsert });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    static getListCron() {
        return new Promise(async resolve => {
            try {
                let listCron = await CRON_COLL.find()
                if (!listCron) return resolve({ error: true, message: 'cannot_get_list_data' });
                return resolve({ error: false, data: listCron });
            } catch (error) {

                return resolve({ error: true, message: error.message });
            }
        })
    }
}