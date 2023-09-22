import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { UserModel } from './dao/models/usermodel.js'; 
import { connectDB } from './dao/database.js';

//0. Conecta a base de datos
console.log('Intentando conectar a la base de datos...');
await connectDB();
console.log('Conexión a la base de datos establecida.');

// 1. Carga de las variables de entorno
console.log('Cargando variables de entorno...');
dotenv.config();
console.log('Variables de entorno cargadas.');

// 2. Configuración de Passport
console.log('Configurando Passport...');
passport.serializeUser((user, done) => {
  console.log('Serializando usuario...');
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('Deserializando usuario...');
  try {
    const user = await UserModel.findById(id);
    console.log('Usuario deserializado:', user);
    done(null, user);
  } catch(err) {
    console.error('Error deserializando usuario:', err);
    done(err);
  }
});

passport.use(new GitHubStrategy({
  clientID: process.env.client_ID,
  clientSecret: process.env.clientSecret,
}, async (accessToken, refreshToken, profile, done) => {
  console.log('Ejecutando estrategia GitHub...');
  try {
    let user = await UserModel.findOne({ githubId: profile.id });
    if (!user) {
      console.log('Creando nuevo usuario a partir de datos de GitHub...');
      user = new UserModel({ 
        githubId: profile.id, 
        email: profile.emails[0]?.value,
        first_name: profile.displayName,
        last_name: '' 
      });
      await user.save();
      console.log('Nuevo usuario creado y guardado.');
    }
    return done(null, user);
  } catch (err) {
    console.error('Error en estrategia GitHub:', err);
    done(err);
  }
}));

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  console.log('Ejecutando estrategia local...');
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado con el correo:', email);
      return done(null, false);
    }
    
    console.log('Comprobando contraseña...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Contraseña incorrecta.');
      return done(null, false);
    }

    console.log('Inicio de sesión local exitoso.');
    return done(null, user);
  } catch (err) {
    console.error('Error en estrategia local:', err);
    done(err);
  }
}));
console.log('Configuración de Passport completada.');

// 3. Configuración de la sesión
console.log('Configurando sesión...');
const sessionMiddleware = session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7200000 } // 2 horas
});
console.log('Configuración de la sesión completada.');

export const setupAuth = (app) => {
  console.log('Estableciendo middleware de autenticación...');
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Middleware de autenticación establecido.');
};
