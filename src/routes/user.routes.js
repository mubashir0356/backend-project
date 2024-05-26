import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router()

// userRouter.route("/register").post(registerUser)

userRouter.post("/register",
    upload.fields([
        {
            name: "avatar", // better to give file name as in user schema
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

userRouter.route("/login").post(loginUser)

export default userRouter