import dotenv from "dotenv"
import connectDatabase from './database/database.js'
import { app } from "./app.js"


dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 5000

connectDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}).catch(error => console.error("Error while connecting DB ", error))