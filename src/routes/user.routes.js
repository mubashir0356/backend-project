import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
userRouter.route("/regenerateAcessztoken").post(refreshAccessToken)

//secure routes
userRouter.route("/logout").post(verifyJWT, logoutUser)

export default userRouter