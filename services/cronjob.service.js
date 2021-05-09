"use strict";
const cron 							= require("node-cron")
const Cron 							= require("moleculer-cron");
const moment 						= require('moment');
const parser 						= require('cron-parser');
const DbService         			= require("../mixins/db.mixin");
const CacheCleaner         			= require("../mixins/cache.cleaner.mixin");
const CRON_MODEL					= require("../models/core/cron");
const CRON_COLL						= require("../database/test/cron_coll");
const PRODUCT_SERVICE				= require("../services/product.service");
const { CF_SERVICES }   			= require('../config/constants/services');
const { CF_ACTIONS_CRONJOB }   		= require('../config/constants/actions');

module.exports = {
	
	name: CF_SERVICES.CRON_JOB,
	mixins: [
		DbService(CRON_COLL), 
		CacheCleaner([CF_SERVICES.CRON_JOB]),
		Cron,
		PRODUCT_SERVICE
	],
    
	/**
	 	* Service settings
	*/

	// crons: [
    //     {
    //         name: "getListUser",
    //         cronTime: `${ CRON_MODEL.getList()}`,
            
    //         onTick: async function() {

    //             var job = this.getJob("getListUser");

    //             this.getLocalService("cronjob")
    //                 .actions.listProduct()
    //                 .then((data) => {
    //                     console.log("ListUser", data);
    //                 });
    //                 job.start();
    //             },
            
    //             runOnInit: function() {
    //             console.log("List User is created");
    //         },
    //         // manualStart: true,
    //         timeZone: 'Asia/Ho_Chi_Minh'
    //     },
    // ],

    actions: {
		[CF_ACTIONS_CRONJOB.ADD_CRON] : {
		
			async handler(ctx) {
				// reset database cron job
				// await CRON_MODEL.deleteMany({__v: 0});
				let {_id: authorID} = ctx.meta.inforUser;
				let dateFormat = await this.checkValid(ctx.params)

				let date = await CRON_MODEL.createCron(dateFormat.minutes,dateFormat.hours,dateFormat.dayOfMonth,dateFormat.month,dateFormat.dayOfWeek, authorID);
				// let date = await CRON_MODEL.getListCron();
				let secondCron = date.data;
				return this.crontab({secondCron});
			}
		},
	},

	/**
	 	* Events
	*/
	events: {
	
	},

	/**
		 * Methods
	*/
	methods: {
		async crontab({secondCron}) {
			
			// console.log( 
			// 	secondCron.minute,
			// 	secondCron.hours,
			// 	secondCron.dayOfMonth,
			// 	secondCron.month,
			// 	secondCron.dayOfWeek,
			// );

			cron.schedule(`${secondCron.minute} ${secondCron.hours} ${secondCron.dayOfMonth} ${secondCron.month} ${secondCron.dayOfWeek}`, () => {
				// this.[CF_ACTIONS_PRODUCTS.GET_LIST];
				console.log('Do some thing');
				// call method service remote ( call method from product services )
				
				this.testCronJob();
			});
			
			moment.locale('vi');

			var interval = parser.parseExpression(`${secondCron.minute} ${secondCron.hours} ${secondCron.dayOfMonth} ${secondCron.month} ${secondCron.dayOfWeek}`);

			return `Đã lên lịch vào: ${moment(interval.next().toString()).format('LLLL')}`
		},

		checkValid (date){
			let { 
				month, 
				day,
				hours,
				minutes,
				second,
				dayOfMonth,
				dayOfWeek
			} = date;
			if (!month){
				date.month = "*";
			}

			if (day==0){
				date.day = 1;
			}

			if (!day){
				date.day = "*";
			}

			if (!hours && hours != 0){
				date.hours = "*";
			}

			if (!minutes && minutes != 0){
				date.minutes = "*";
			}

			if (!second && second != 0){
				date.second = "*";
			}
			if (!dayOfMonth){
				date.dayOfMonth = "*";
			}
			if (!dayOfWeek){
				date.dayOfWeek = "*";
			}
			return date;
		}
	},
	

    started() {
		
    }
};
