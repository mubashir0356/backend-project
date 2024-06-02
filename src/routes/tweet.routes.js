import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet
} from "../controllers/tweet.controller.js";

const tweetsRouter = Router()
tweetsRouter.use(verifyJWT)

tweetsRouter.route("/").post(createTweet)
tweetsRouter.route("/:tweetId").patch(updateTweet).delete(deleteTweet)
tweetsRouter.get("/user/:userId", getUserTweets)

export default tweetsRouter