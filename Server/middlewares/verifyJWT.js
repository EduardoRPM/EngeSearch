const { response, request } = require("express");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user.model");


const verifyJWT = async (req, res, next) => {
    const token = req.header("authorization");
    if (!token) {
        return res.status(401).json({
            msg: "No token provided"
        });
    }
    try {
        const {username} = jwt.verify(token, process.env.secret_key);
        console.log("Decoded JWT username:", username);
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                msg: "Token no válido - usuario no existe en DB"
            });
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            msg: "Token no válido"
        });
    }
};

module.exports = { 
    verifyJWT 
};
