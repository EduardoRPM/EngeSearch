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
        this.authPath = "/auth";
        
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
        this.app.use(this.authPath, require("../routes/auth.route"));

  
        this.app.get(/.*/, function (req, res) {
            res.status(404).json({
                msg: "Ruta no encontrada",
            });
        });
    }

    middlewares() {
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json());

        // Simple request logger to help debug front-end requests
        this.app.use((req, res, next) => {
            try {
                const now = new Date().toISOString();
                const params = JSON.stringify(req.params || {});
                const query = JSON.stringify(req.query || {});
                const body = JSON.stringify(req.body || {});
                console.log(`[HTTP] ${now} ${req.method} ${req.originalUrl} params=${params} query=${query} body=${body}`);
            } catch (err) {
                console.log('[HTTP] Error logging request', err && err.stack ? err.stack : err);
            }
            next();
        });
    }
}

module.exports = Server;
