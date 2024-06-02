import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const commentRouter = Router()
commentRouter.use(verifyJWT)



export default commentRouter