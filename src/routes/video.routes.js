import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo
} from "../controllers/video.controller.js";

const videoRouter = Router()
videoRouter.use(verifyJWT) // using verify jwt middleware for all routes

videoRouter.route("/").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)

videoRouter.route("/:videoId").get(getVideoById)
videoRouter.route("/:videoId").delete(deleteVideo)
videoRouter.route("/toggle/publish/:videoId").patch(togglePublishStatus)
videoRouter.route("/:videoId").patch(upload.single("thumbnail"), updateVideo)

export default videoRouter