module.exports = {
    name: "Awesome",

    localAction(next, action) {
        return function(ctx) {
            console.log(`My middleware is called before the  action executed.`);
            return next(ctx);
        }
    }
};