const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        if (req.method === "OPTIONS") return next();
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            throw new Error("Invalid authorization");
        }
        const tokenData = jwt.verify(token, "authentication_web_token");
        req.userData = tokenData;
        next();
    } catch (error) {
        return next(new HttpError("Unauthenticated, Please Login First", 403));
    }
};
