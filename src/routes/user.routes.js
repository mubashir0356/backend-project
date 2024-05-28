import { Router } from "express";
import {
    changePassword,
    getChannelProfile,
    getUserDetails,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAcountDetails,
    updateAvatar,
    updateCoverImage
} from "../controllers/user.controller.js";
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
userRouter.route("/change-password").post(verifyJWT, changePassword)
userRouter.route("/get-user").get(verifyJWT, getUserDetails)
userRouter.route("/update-user-details").patch(verifyJWT, updateAcountDetails)

// using multiple middlewares
userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
userRouter.route("/update-cover-img").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

userRouter.route("/channel/:username").get(verifyJWT, getChannelProfile)
userRouter.route("/history").get(verifyJWT, getWatchHistory)

export default userRouter