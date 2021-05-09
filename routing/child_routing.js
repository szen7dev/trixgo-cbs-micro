


class ChildRouter{
    // constructor(basePath) {
    // }
    /**
     * 
     * @param {*} msg 
     * @param {*} res 
     * @param {*} data 
     * @param {*} code
     * @param {*} status  tham số nhận biết lỗi
     */
    static responseError(msg, res, data, code, status) {
        if (code) {
            res.status(code);
        }
        return res.json({error: true, message: msg, data: data, status: status});
    }

    static responseSuccess(msg, data, code) {
        if (code) {
            res.status(code);
        }

        return ({error: false, message: msg, data: data});
    }

    static pageNotFoundJson(res) {
        res.status(404);
        return res.json({"Error": "Page not found!"});
    }

    static redirect(res, path) {
        return res.redirect(path);
    }
}

module.exports = ChildRouter;