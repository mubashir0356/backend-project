import mongoose from "mongoose"
import { DB_NAME } from '../constants.js'

const connectDatabase = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n Database connected successfully !! DB host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Error while connecting to MongoDB :", error)
        process.exit(1)
    }
}

export default connectDatabase