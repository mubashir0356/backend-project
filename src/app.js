import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(cookieParser())
app.use(express.static("public"))

//import routes
import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

// declare routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)

export { app }