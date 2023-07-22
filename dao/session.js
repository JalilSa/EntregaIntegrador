import mongoose from "mongoose";


mongoose.connect('mongodb://2717');

export const getAll = async () => {
    let result;
    try {
        result = await userModel.find()
    } catch (error) {
        console.log(error)
    }

    return result;
}

export const getByEmail = async email => {
    let result;
    try {
        result = await userModel.findOne({ email })
    } catch (error) {
        console.log(error)
    }

    return result;
}

export const createUser = async user => {
    let result;
    try {
        result = await userModel.create(user)
    } catch (error) {
        console.log(error)
    }

    return result;
}