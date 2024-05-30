import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!(title || description)) {
        throw new APIError(400, "Thumbnail and description are required")
    }

    const userId = req?.user._id
    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    // console.log(req.files, "uploaded files details")

    if (!videoFileLocalPath) {
        throw new APIError(400, "Upload a video")
    }

    if (!thumbnailLocalPath) {
        throw new APIError(400, "Upload a thumbnail for the video")
    }

    const video = await uploadToCloudinary(videoFileLocalPath)
    const thumbnail = await uploadToCloudinary(thumbnailLocalPath)

    // console.log(video, "cloudinary video details")

    if (!video) {
        throw new APIError(500, "Something went wrong while uploading the video to cloudinary")
    }

    if (!thumbnail) {
        throw new APIError(500, "Something went wrong while uploading the thumbnail to cloudinary")
    }

    // console.table([videoFileLocalPath, thumbnailLocalPath])
    const videoDetails = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: video.duration.toFixed(2),
        owner: userId
    })

    if (!videoDetails) {
        throw new APIError(500, "Something went wrong while uploading the video to database")
    }

    return res
        .status(200)
        .json(
            new APIResponse(400, videoDetails, "Video uploaded susccessfully")
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}