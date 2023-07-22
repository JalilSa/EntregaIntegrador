import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Una vez que la conexión esté abierta, intentamos eliminar el índice
    mongoose.connection.once('open', function() {
      mongoose.connection.db.collection('users', function(err, collection) {
        if (err) {
          console.error('Error al acceder a la colección de usuarios:', err);
          return;
        }
        collection.dropIndex('username_1', function(err, result) {
          if (err) {
            console.error('Error al eliminar el índice:', err);
            return;
          }
          console.log('Índice eliminado');
        });
      });
    });

    console.log('Base de datos conectada');
  } catch (error) {
    console.error('Error al conectar a la base de datos', error);
    process.exit(1);
  }
};
