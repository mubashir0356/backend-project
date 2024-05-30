import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromClodinary, uploadToCloudinary } from "../utils/cloudinary.js"


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

    const userId = req.user?._id
    const localVideoFile = req.files?.videoFile[0]
    const localThumbnailFile = req.files?.thumbnail[0]

    // console.log(req.files, "uploaded files details")

    if (!localVideoFile) {
        throw new APIError(400, "Upload a video")
    }

    if (!localThumbnailFile) {
        throw new APIError(400, "Upload a thumbnail for the video")
    }

    const video = await uploadToCloudinary({ ...localVideoFile, userName: req.user?.username })
    const thumbnail = await uploadToCloudinary({ ...localThumbnailFile, userName: req.user?.username })

    // console.log(video, "cloudinary video details")

    if (!video) {
        throw new APIError(500, "Something went wrong while uploading the video to cloudinary")
    }

    if (!thumbnail) {
        throw new APIError(500, "Something went wrong while uploading the thumbnail to cloudinary")
    }

    // console.table([localVideoFile, localThumbnailFile])
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

    if (!videoId) {
        throw new APIError(400, "Video Id is required")
    }
    //TODO: get video by id
    const video = await Video.findById(videoId)

    if (!video) {
        throw new APIError(500, "Unable to fetch video details")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, video, "Video details fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!videoId) {
        throw new APIError(400, "Video Id is required")
    }

    const { title, description } = req.body

    if (!(title || description)) {
        throw new APIError(400, "Title or Description not provided")
    }

    const localThumbnailFile = req.file

    if (!localThumbnailFile) {
        throw new APIError(400, "Upload thumbnail file")
    }

    // console.log(localThumbnailFile, "thumbfile")

    // deleting existing thumbnail

    const video = await Video.findById(videoId)

    await deleteFromClodinary(video.thumbnail)

    const thumbnail = await uploadToCloudinary({ ...localThumbnailFile, userName: req.user?.username })

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            title,
            description,
            thumbnail: thumbnail.url
        },
        {
            new: true
        }
    )

    return res.status(200).json(new APIResponse(200, updatedVideoDetails, "Video details updated."))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new APIError(400, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new APIError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    // deleting thumbnail

    const deletedThumbnailInfo = await deleteFromClodinary(video.thumbnail)

    // console.log(deletedThumbnailInfo, "dltInfo")

    if (deletedThumbnailInfo.result !== "ok") {
        throw new APIError(500, "Error while deleting the video thumbnail from cloudinary")
    }

    // deleting video

    const deletedVideoInfo = await deleteFromClodinary(video.videoFile)

    if (deletedVideoInfo.result !== "ok") {
        throw new APIError(500, "Error while deleting the video thumbnail from cloudinary")
    }

    const isVideoDeleted = await Video.findByIdAndDelete(videoId)

    console.log(isVideoDeleted, "isdeleted")

    if (!isVideoDeleted) {
        throw new APIError(500, "Unable to delete cideo from database")
    }

    return res.status(200).json(new APIResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new APIError(400, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new APIError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    const publishedStatus = video.isPublished

    video.isPublished = !publishedStatus
    await video.save({ validateBeforeSave: false })

    return res.status(200).json(new APIResponse(200, { videoPublishedStatus: !publishedStatus }, "Published status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}