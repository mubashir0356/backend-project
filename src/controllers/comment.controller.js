import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { commentContent } = req.body
    if (!commentContent) {
        throw new APIError(400, "Add comment content.")
    }
    const { videoId } = req.params

    if (!videoId) {
        throw new APIError(400, "Video id is required.")
    }

    if (!isValidObjectId(videoId)) {
        throw new APIError(400, "Invalid video id.")
    }

    const comment = await Comment.create({
        content: commentContent,
        owner: req.user?._id,
        video: videoId
    })

    if (!comment) {
        throw new APIError(500, "Something went wrong while writing comment in database.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, comment, "Comment added successfully.")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params

    const { commentContent } = req.body
    if (!commentContent) {
        throw new APIError(400, "Edited comment content is required.")
    }

    if (!commentId) {
        throw new APIError(400, "Comment id not found.")
    }

    if (!isValidObjectId(commentId)) {
        throw new APIError(400, "Invalid comment id.")
    }

    const existingComment = await Comment.findById(commentId)

    if (!(existingComment.owner.toString() === req.user?._id.toString())) {
        throw new APIError(401, "A user can edit his own comments only.")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: commentContent
            }
        },
        { new: true }
    )

    if (!updatedComment) {
        throw new APIError(500, "Something went wrong while editing comment. Please try again.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, updatedComment, "Comment edited successfully.")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!commentId) {
        throw new APIError(400, "Comment id not found.")
    }

    if (!isValidObjectId(commentId)) {
        throw new APIError(400, "Invalid comment id.")
    }

    const existingComment = await Comment.findById(commentId)

    if (!(existingComment.owner.toString() === req.user?._id.toString())) {
        throw new APIError(401, "A user can delete his own comments only.")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new APIError(500, "Something went wrong while deleting comment. Please try again.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, {}, "Comment deleted successfully.")
        )

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}