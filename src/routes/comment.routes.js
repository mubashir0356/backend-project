import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/comment.controller.js";


const commentRouter = Router()
commentRouter.use(verifyJWT)

commentRouter.route("/:videoId").get(getVideoComments).post(addComment);
commentRouter.route("/comment/:commentId").patch(updateComment).delete(deleteComment)

export default commentRouter