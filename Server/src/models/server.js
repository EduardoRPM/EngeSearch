const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');
const connectDB = require('../config/database');


class Server {

    constructor() {
        this.port = process.env.PORT || 8080;
        this.app = express();
        this.corsOptions = {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
        this.middlewares();
        this.itemsPath = "/items";
        this.usersPath = "/users";

        this.routes();
        connectDB();

    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`Servidor corriendo en el puerto ${this.port}`);
        });
    }

    routes() {
        this.app.use(this.itemsPath, require("../routes/items.route"));
        this.app.use(this.usersPath, require("../routes/users.route"));



        this.app.get(/.*/, function (req, res) {
            res.status(404).json({
                msg: "Ruta no encontrada",
            });
        });
    }

    middlewares() {
        this.app.use(express.json());
        this.app.use(cors(this.corsOptions));
    }
}

module.exports = Server;