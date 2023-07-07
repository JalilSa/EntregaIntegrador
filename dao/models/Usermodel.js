import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: { type: String, unique: true},
    password: String,
    age: Number
});

export const UserModel = mongoose.model('users', userSchema)