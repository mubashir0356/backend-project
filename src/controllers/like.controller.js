import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!videoId) {
        throw new APIError(400, "Video id is required.")
    }

    if (!isValidObjectId(videoId)) {
        throw new APIError(400, "Invalid video id.")
    }

    const likedObject = await Like.findOne({
        video: videoId
    })

    if (!likedObject) {
        const newLikedObject = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })

        return res
            .status(200)
            .json(
                new APIResponse(200, newLikedObject, "Video liked successfully")
            )
    }

    await Like.findOneAndDelete({
        video: videoId
    })

    return res
        .status(200)
        .json(
            new APIResponse(200, {}, "Video unliked")
        )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new APIError(400, "Comment id is required.")
    }

    if (!isValidObjectId(commentId)) {
        throw new APIError(400, "Invalid comment id.")
    }

    const likedObject = await Like.findOne({
        comment: commentId
    })

    if (!likedObject) {
        const newLikedObject = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })

        return res
            .status(200)
            .json(
                new APIResponse(200, newLikedObject, "Comment liked successfully")
            )
    }

    await Like.findOneAndDelete({
        comment: commentId
    })

    return res
        .status(200)
        .json(
            new APIResponse(200, {}, "Comment unliked")
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new APIError(400, "Tweet id is required.")
    }

    if (!isValidObjectId(tweetId)) {
        throw new APIError(400, "Invalid tweet id.")
    }

    const likedObject = await Like.findOne({
        tweet: tweetId
    })

    if (!likedObject) {
        const newLikedObject = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        return res
            .status(200)
            .json(
                new APIResponse(200, newLikedObject, "Tweet liked successfully")
            )
    }

    await Like.findOneAndDelete({
        tweet: tweetId
    })

    return res
        .status(200)
        .json(
            new APIResponse(200, {}, "Tweet unliked")
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "uploadedBy",
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
                        $unwind: "$uploadedBy"
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            uploadedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                videoDetails: 1,
                createdAt: 1,
            }
        }
    ])

    // below its aggregation pipeline by chatgpt

    // const videos = await Like.aggregate([
    //     {
    //         $match: {
    //             likedBy: new mongoose.Types.ObjectId(req.user?._id),
    //             video: { $exists: true }
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             let: { videoId: "$video" },
    //             pipeline: [
    //                 { $match: { $expr: { $eq: ["$_id", "$$videoId"] } } },
    //                 {
    //                     $lookup: {
    //                         from: "users",
    //                         let: { ownerId: "$owner" },
    //                         pipeline: [
    //                             { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
    //                             {
    //                                 $project: {
    //                                     fullName: 1,
    //                                     username: 1,
    //                                     avatar: 1,
    //                                     email: 1,
    //                                     coverImage: 1
    //                                 }
    //                             }
    //                         ],
    //                         as: "uploadedBy"
    //                     }
    //                 },
    //                 { $unwind: "$uploadedBy" },
    //                 {
    //                     $project: {
    //                         videoFile: 1,
    //                         thumbnail: 1,
    //                         title: 1,
    //                         description: 1,
    //                         duration: 1,
    //                         views: 1,
    //                         createdAt: 1,
    //                         uploadedBy: 1
    //                     }
    //                 }
    //             ],
    //             as: "videoDetails"
    //         }
    //     },
    //     { $unwind: "$videoDetails" },
    //     {
    //         $project: {
    //             videoDetails: 1,
    //             createdAt: 1
    //         }
    //     }
    // ]);

    return res
        .status(200)
        .json(
            new APIResponse(200, videos, "Liked videos fetched successfully")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}