import dotenv from "dotenv"
import connectDatabase from './database/database.js'

dotenv.config({
    path: './.env'
})

connectDatabase()