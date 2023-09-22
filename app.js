import express from 'express';
import handlebars from 'express-handlebars';
import __dirname from './utils.js';
import fs from 'fs';
import path from 'path';
import { connectDB } from './dao/database.js'; 
import MessageManagerDB from './dao/MessageManagerDB.js';
import { UserModel } from './dao/models/usermodel.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import routes from './routes/rutas.js';
import configureSockets from './config/socketconfig.js';
import { CustomError } from './errorHandler.js';
import logger from './config/logger.js';
import { setupAuth } from './SessionManager.js';


dotenv.config();

const app = express();

// Autenticación primero
setupAuth(app);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// Base de datos
try {
    connectDB();
    logger.info('Database connected successfully');
} catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
}

const httpServer = app.listen(8080, () => logger.info(`Server running on port 8080`));

const messageManager = new MessageManagerDB();
const io = configureSockets(httpServer);

export { app, io }; 

// Set up products
let products = [];
try {
    products = JSON.parse(fs.readFileSync(path.resolve(__dirname, './productos.json'), 'utf-8'));
    logger.info('productos.json loaded successfully.');
} catch (err) {
    logger.error(`Error al leer el archivo productos.json: ${err.message}`);
    throw new CustomError("READ_FILE_ERROR", `Error al leer el archivo: ${err.message}`);
}

// Setup handlebars
app.engine('handlebars', handlebars.engine({ runtimeOptions: { allowProtoPropertiesByDefault: true } }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Rutas de vistas
app.use(routes);

// Check if the admin user exists, and if not, create it
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

UserModel.findOne({ email: adminEmail }).then(user => {
    if (!user) {
        const adminUser = new UserModel({
            username: 'admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });
        adminUser.save().then(() => {
            logger.info('Usuario administrador creado.');
        }).catch(err => {
            logger.error(`No se pudo crear el usuario administrador: ${err.message}`);
        });
    } else {
        logger.info('Usuario administrador ya existe.');
    }
}).catch(err => {
    logger.error(`Error buscando al usuario administrador: ${err.message}`);
});

// Error handling middleware
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);  // Detiene el proceso después de registrar el error
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

