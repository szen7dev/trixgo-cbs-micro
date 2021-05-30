// "use strict";

// const path 		= require("path");
// const mkdir 	= require("mkdirp").sync;

// const DbService	= require("moleculer-db");

// let  { development, product } =  require("../../tools/db/cf_database")

// module.exports = function(collection) {
// 	const MongoAdapter = require("moleculer-db-adapter-mongoose");
	
// 		if (process.env.MONGO_URI) {
// 			// Mongo adapter
	
// 			return {
// 				mixins: [DbService],
// 				adapter: new MongoAdapter(process.env.MONGO_URI, { 
// 					useNewUrlParser: true, 
// 					useUnifiedTopology: true 
// 				}),
// 				model: collection,
// 				methods: {
// 					fixStringToId(idString) {
// 						if ( typeof this.adapter.stringToObjectID !== "undefined" ) {
// 							return this.adapter.stringToObjectID(idString);
// 						}
// 						return idString;
// 					}
// 				}
// 			};
// 		}
	
// 		// --- NeDB fallback DB adapter
	
// 		// Create data folder
// 		mkdir(path.resolve("../data"));
	
// 		return {
// 			mixins: [DbService],
// 			adapter: new DbService.MemoryAdapter({ filename: `../data/${collection}.db` }),
	
// 			methods: {
// 				entityChanged(type, json, ctx) {
// 					return this.clearCache().then(() => {
// 						const eventName = `${this.name}.entity.${type}`;
// 						this.broker.emit(eventName, { meta: ctx.meta, entity: json });
// 					});
// 				},
// 				fixStringToId(idString) {
// 					return idString;
// 				}
// 			}
// 		};
	

// };



"use strict";

const path 		= require("path");
const mkdir 	= require("mkdirp").sync;

const DbService	= require("moleculer-db");

let  { development, product } =  require("../../tools/db/cf_database")

module.exports = function(collection) {
	const MongoAdapter = require("moleculer-db-adapter-mongoose");
	let isDevlopment  = true;
	if(isDevlopment){
		let URI = `mongodb://localhost/${development._mongod_name}`;
		return {
			mixins: [DbService],
			adapter: new MongoAdapter(URI, { 
				useNewUrlParser: true, 
				useUnifiedTopology: true 
			}),
			model: collection,
			methods: {
				fixStringToId(idString) {
					if ( typeof this.adapter.stringToObjectID !== "undefined" ) {
						return this.adapter.stringToObjectID(idString);
					}
					return idString;
				}
			}
		};
	}else{
		if (process.env.MONGO_URI) {
			// Mongo adapter
	
			return {
				mixins: [DbService],
				adapter: new MongoAdapter(process.env.MONGO_URI, { 
					useNewUrlParser: true, 
					useUnifiedTopology: true 
				}),
				model: collection,
				methods: {
					fixStringToId(idString) {
						if ( typeof this.adapter.stringToObjectID !== "undefined" ) {
							return this.adapter.stringToObjectID(idString);
						}
						return idString;
					}
				}
			};
		}
	
		// --- NeDB fallback DB adapter
	
		// Create data folder
		mkdir(path.resolve("../data"));
	
		return {
			mixins: [DbService],
			adapter: new DbService.MemoryAdapter({ filename: `../data/${collection}.db` }),
	
			methods: {
				entityChanged(type, json, ctx) {
					return this.clearCache().then(() => {
						const eventName = `${this.name}.entity.${type}`;
						this.broker.emit(eventName, { meta: ctx.meta, entity: json });
					});
				},
				fixStringToId(idString) {
					return idString;
				}
			}
		};
	}

};
