const mongoose = require('mongoose');

const conectDB = async () => {

    const conststring = process.env.mongo_string;
    const dbName = process.env.mongo_db;
        mongoose.connect(conststring,{
            dbName : dbName,
        }).then(() => {
            console.log('Base de datos conectada');
        }
        ).catch((error) => {
            console.log('Error al conectar con la base de datos', error);
            console.error('Error al conectar con la base de datos', error);
        });
};

module.exports = conectDB;
