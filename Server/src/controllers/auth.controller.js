const { response, request } = require("express");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const login = async (req = request, res = response) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            msg: "Faltan datos obligatorios"
        });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                msg: "Usuario / Password no son correctos - username"
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                msg: "Usuario / Password no son correctos - password"
            });
        }
        const payload = {
            username: user.username,
            role: user.rol,
        };

        const token = jwt.sign(payload, process.env.secret_key, {
            expiresIn: "2h"
        });

        return res.status(200).json({
            msg: "Login exitoso",
            token,
            role: user.rol,
            username: user.username
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hable con el administrador"
        });
    }

  

};
const register = async (req = request, res = response) => {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            msg: "Faltan datos obligatorios"
        });
    }
    try {
        const user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({
                msg: "El usuario ya existe"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            rol: role === 'admin' ? 'admin' : 'user'
        });

        await newUser.save();
        return res.status(201).json({
            msg: "Usuario creado exitosamente",
            role: newUser.rol
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor"
        });
    }
};

module.exports = {
    login,
    register
};
