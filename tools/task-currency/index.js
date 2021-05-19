// xử lý tác vụ như promise.all
    //+ handle concurrency
    //+ off/on stop when 1 in all error
let pMap = require('p-map');

const pMapCovert = async ({ input, mapper, concurrency, stopOnError = true }) => {
    return new Promise(async resolve => {
        try {
            let results = await pMap(input, mapper, {
                concurrency,
                stopOnError
            });
            return resolve({ error: false, data: results });    
        } catch (error) {
            return resolve({ error: true, message: error });
        }
        
    });
}

exports._promiseAll = pMapCovert;

// // demo
// let promise1 = () => {
//     return new Promise(resolve => {
//         console.log(`---promise--1`)
//         setTimeout(_ => resolve(`promise_1`), 1000)
//     })
// }

// let promise2 = () => {
//     return new Promise((resolve, reject) => {
//         console.log(`---promise--2`)
//         setTimeout(_ => reject(`promise_2`), 2000)
//     })
// }

// let promise3 = () => {
//     return new Promise(resolve => {
//         console.log(`---promise--3`)
//         setTimeout(_ => resolve(`promise_3`), 3000)
//     })
// }

// // đã demo được số lượng CONCURRENCY run job
// (async function run() {
//     console.time('total_promise')
//     let actions = [promise1, promise2, promise3];
//     let mapper = item => item();
//     try {
//         let result = await pMapCovert({ input: actions, mapper, concurrency: 2 });
//         console.log({ result })
//         console.timeEnd('total_promise')
//     } catch (error) {
//         console.log({ error: error })
//     }
    
// })();