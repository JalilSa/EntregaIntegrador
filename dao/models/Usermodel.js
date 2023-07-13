import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String },
    password: { type: String },
    githubId: { type: String }, 
    role: { type: String, default: 'user' }
});

// Añadir el índice compuesto
userSchema.index({ email: 1, githubId: 1 }, { unique: true, sparse: true });

export const UserModel = mongoose.model('users', userSchema);
