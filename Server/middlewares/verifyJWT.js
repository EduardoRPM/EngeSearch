const { response, request } = require("express");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user.model");

const verifyJWT = async (req = request, res = response, next) => {
    const token = req.header("authorization");
    if (!token) {
        return res.status(401).json({
            msg: "No token provided"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.secret_key);
        const userId = decoded.userId;
        let user = null;

        if (userId) {
            user = await User.findById(userId);
        }

        if (!user && decoded.username) {
            user = await User.findOne({ username: decoded.username });
        }

        if (!user) {
            return res.status(401).json({
                msg: "Token no válido - usuario no existe en DB"
            });
        }

        req.user = {
            id: user._id,
            username: user.username,
            role: user.rol
        };

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
