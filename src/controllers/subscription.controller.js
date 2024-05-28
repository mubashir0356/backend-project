import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new APIError(400, "Channel Id is invalid")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    })

    if (!isSubscribed) {
        await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId,
        });

        return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    { subscribed: true },
                    "Subscribed successfully"
                )
            );
    } else {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    { subscribed: false },
                    "Unsubscribed successfully"
                )
            );
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new APIError(400, "Subscriber id is recquired")
    }

    const subscribedChannels = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "channel",
                            foreignField: "_id",
                            as: "channelDetails",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        email: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$channelDetails" // will flattern "channelDetails" array
                    },
                    {
                        $project: {
                            createdAt: 1,
                            updatedAt: 1,
                            channelDetails: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribedChannelsCount: {
                    $size: "$subscribedTo"
                },
            }
        },
        {
            $project: {
                subscribedTo: 1,
                subscribedChannelsCount: 1
            }
        }
    ])

    console.log(subscribedChannels, "subscribedChannels")

    return res.status(200).json(
        new APIResponse(200, subscribedChannels[0], "Subscribed channels fetched successfully")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}