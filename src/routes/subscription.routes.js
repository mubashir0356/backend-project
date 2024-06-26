import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router()

subscriptionRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// subscriptionRouter.route("/channel/:channelId")
//     .get(getSubscribedChannels)
//     .post(toggleSubscription);

subscriptionRouter.route("/channel/:channelId").post(toggleSubscription);

subscriptionRouter.route("/subscribers/:subscriberId").get(getSubscribedChannels);
subscriptionRouter.route("/channelSubscribers/:channelId").get(getUserChannelSubscribers);

export default subscriptionRouter
