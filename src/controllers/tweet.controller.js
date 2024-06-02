import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { tweetContent } = req.body

    if (!tweetContent) {
        throw new APIError(400, "Write a tweet.")
    }

    const tweet = await Tweet.create({
        content: tweetContent,
        owner: req.user?._id,
    })

    if (!tweet) {
        throw new APIError(500, "Something went wrong while writing a tweet in database.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, tweet, "Tweet added successfully.")
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if (!userId) {
        throw new APIError(400, "User id is required.")
    }

    if (!isValidObjectId(userId)) {
        throw new APIError(400, "Invalid user id.")
    }

    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "userTweets"
            }
        }
    ])

    console.log(user, "user tweets")

    return res
        .status(200)
        .json(new APIResponse(200, user[0].userTweets, "User tweets fetched successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params

    const { tweetContent } = req.body
    if (!tweetContent) {
        throw new APIError(400, "Edited tweet is required.")
    }

    if (!tweetId) {
        throw new APIError(400, "Tweet id not found.")
    }

    if (!isValidObjectId(tweetId)) {
        throw new APIError(400, "Invalid tweet id.")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if (!(existingTweet.owner.toString() === req.user?._id.toString())) {
        throw new APIError(401, "A user can edit his own tweets only.")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: tweetContent
            }
        },
        { new: true }
    )

    if (!updatedTweet) {
        throw new APIError(500, "Something went wrong while updating the tweet. Please try again.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, updatedTweet, "Tweet updated successfully.")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!tweetId) {
        throw new APIError(400, "Tweet id not found.")
    }

    if (!isValidObjectId(tweetId)) {
        throw new APIError(400, "Invalid tweet id.")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if (!(existingTweet.owner.toString() === req.user?._id.toString())) {
        throw new APIError(401, "A user can delete his own tweets only.")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
        throw new APIError(500, "Something went wrong while deleting the tweet. Please try again.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, {}, "Tweet deleted successfully.")
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}