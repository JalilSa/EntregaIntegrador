import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, unique: true },
    age: { type: Number },
    password: { type: String },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
    role: { type: String, default: 'user' }

});

// Método para cifrar la contraseña antes de guardar el usuario
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();

  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

// Método para comparar las contraseñas
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

export const UserModel = mongoose.model('users', userSchema);
