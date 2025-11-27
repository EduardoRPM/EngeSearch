const {response, request} = require("express");
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
        
        const token = jwt.sign({
                username: user.username,
                role: user.role,
            }, process.env.secret_key, { 
                expiresIn: "2h" 
            }, (err, token) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        msg: "Error generando el token"
                    });
                }
                return res.status(200).json({
                    msg: "Login exitoso",
                    token
                });
            }
        );


        // Verificar contraseña 
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hable con el administrador"
        });
    }

  

};
const register = async (req = request, res = response) => {
    const { username, password } = req.body;
    
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
            rol: 'user' 
        });

        await newUser.save();   
        res.status(200).json({
            msg: "Usuario creado exitosamente"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidors"
        });
    }
    res.status(201).json({
        msg: "Registro"
    });

}; 

module.exports = {
    login,
    register
};
