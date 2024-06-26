import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadToCloudinary, deleteFromClodinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

// use this while setting or clearing cookies so that only server can modify cookies

const cookieOptions = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshTokens = async (userid) => {

    try {
        const userDetails = await User.findById(userid)
        const accessToken = userDetails.generateAccessToken()
        const refreshToken = userDetails.generateRefreshToken()

        userDetails.refreshToken = refreshToken
        await userDetails.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new APIError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { username, email, fullName, password } = req.body // no files are included since they are handeled by req.files(multer)

    const isAnyFieldEmpty = [username, email, fullName, password].some(field => field?.trim() === "")
    if (isAnyFieldEmpty) {
        throw new APIError(400, "All fields are required")
    }
    if (!email.includes("@")) {
        throw new APIError(400, "Invalid email format")
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existingUser) {
        throw new APIError(409, "User already exist")
    }

    //  accessing files using multer 
    const avatarLocalFile = req.files?.avatar[0]
    let coverImgLocalFile
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImgLocalFile = req.files.coverImage[0]
    }
    if (!avatarLocalFile) {
        throw new APIError(400, "Avatar file is required")
    }

    const avatar = await uploadToCloudinary({ ...avatarLocalFile, userName: username })
    const coverImage = await uploadToCloudinary({ ...coverImgLocalFile, userName: username })

    if (!avatar) {
        throw new APIError(500, "Something went wrong uploading avatar")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: {
            url: avatar.url || "",
            publicID: avatar.public_id || ""
        },
        coverImage: {
            url: coverImage.url || "",
            publicID: coverImage.public_id || ""
        },
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new APIError(500, "Something went wrong while registering user")
    }

    res.status(201).json(new APIResponse(200, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    // take p/w, username or email - req body
    // check if user exist
    // check is password correct
    // generate refresh and access tokens
    // return tokens in cookies and response

    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new APIError(400, "Username or email fields are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new APIError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password, user.password)
    if (!isPasswordCorrect) {
        throw new APIError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password")

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new APIResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User loggedin succssfully")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    // steps: remove refresh token in db
    //  clear tokens pressent in cookies

    const userId = req.user._id // from missleware wo got user object in request

    const user = await User.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: 1 } },
        { new: true }
    )

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new APIResponse(200, {}, "User loggedout successfully")
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get incoming refreshtoken of user from cookies or body
    // decode token - we will get _id of user from it
    // find user with decoded token 
    // compare stored refreshed token with incoming refreshtoken
    // generate new tokens
    // send new access and refresh tokens

    const incomingToken = req.cookies?.refreshToken || req.body.refreshToken

    if (!incomingToken) {
        throw new APIError(401, "Unauthorized access")
    }

    const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new APIError(401, "Invalid refresh token")
    }

    if (incomingToken !== user.refreshToken) {
        throw new APIError(401, "Invalid refresh token")
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new APIResponse(
            200,
            {
                accessToken,
                newRefreshToken
            },
            "Access token regenrated successfully")
        )
})

const changePassword = asyncHandler(async (req, res) => {
    // take p/w- old and new
    // find user
    // compare old p/w and p/w stored in db
    // save new p/w
    // send res

    const { oldPassword, newPassword } = req.body

    if (!(oldPassword || newPassword)) {
        throw new APIError(400, "password fields are required")
    }

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new APIError(400, "Old password did not match")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new APIResponse(200, {}, "Pasword changed successfully"))
})

const getUserDetails = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new APIResponse(
            200,
            { userDetails: req.user },
            "User details fetched successfully"
        ))
})

const updateAcountDetails = asyncHandler(async (req, res) => {
    // take required fields from body
    // find the user
    // update the details
    // send response
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new APIError(400, "All fields are mandatory")
    }

    // returns updated user object
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(
            new APIResponse(200, user, "User details updated successfully")
        )
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalFile = req.file

    if (!avatarLocalFile) {
        throw new APIError(400, "Avatar file is recquired")
    }
    // deleting old avatar from cloudinary
    const user = await User.findById(req.user._id)

    const deleteOldAvatar = await deleteFromClodinary(user.avatar.publicID, "image")

    // console.log(deleteOldAvatar, "deleted Details")

    const avatar = await uploadToCloudinary({ ...avatarLocalFile, userName: req.user?.username })

    const updatedAvatarDetails = {
        url: avatar.url || "",
        publicID: avatar.public_id || ""
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: updatedAvatarDetails }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(
        new APIResponse(200, updatedUser, "Avatar img updated successfully")
    )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalFile = req.file

    if (!coverImageLocalFile) {
        throw new APIError(400, "Cover Image file is recquired")
    }
    // deleting old cover img from cloudinary
    const user = await User.findById(req.user._id)

    const deleteOldCoverImage = await deleteFromClodinary(user.coverImage.publicID, "image")

    // console.log(deleteOldAvatar, "deleted Details")

    const coverImage = await uploadToCloudinary({ ...coverImageLocalFile, userName: req.user?.username })

    const updatedCoverImgDetails = {
        url: coverImage.url || "",
        publicID: coverImage.public_id || ""
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: updatedCoverImgDetails }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(
        new APIResponse(200, updatedUser, "Cover Image updated successfully")
    )
})

// ----------------: using aggreagations to get channel profile :---------------
// 1st pipeline(pp)- similar to WHERE clause
// 2nd pp : joining with subscription model to get no of subscribers -- array of objects containing subscriber id's
//          local field - field of user model
//          foreign field - field of subscription model
//          as - a new field is created
//          (array or object is known as field) wgile querying a field "$" prefix should be added
// 3rd pp : joining with subscription model to get no of channels the user has subscribed. -- array of objects containing channel id's
// 4th pp : adding fields to the resultant o/p
// 5th pp : it is similar to SELECT query in SQL to show no of fields in the resultant query

const getChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) {
        throw new APIError(400, "Username is not provided")
    }

    const channel = await User.aggregate([
        // 1st pipeline
        {
            $match: { username: username?.toLowerCase() }
        },
        // 2nd pp
        {
            $lookup: {
                from: "subscriptions", // model name will be saved in lowercase and also on plural i.e., Subscription = subscriptions
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // 3rd pp
        {
            $lookup: {
                from: "subscriptions", // model name will be saved in lowercase and also on plural i.e., Subscription = subscriptions
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // 4th pp
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // 5th pp
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    console.log(channel, "channel details")

    if (!channel?.length) {
        throw new APIError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, channel[0], "User channel fetched successfully")
        )
})

// ----------------: using aggreagations to get watch History :---------------
// 1st pp : similar to WHERE clause
// 2nd pp : joining with video model to get watched video list - will get array of objects(all video model if not filtered using $project)
//          local field - field of user model - watchHistory 
//          foreign field - field of subscription model - _id
//          as - a new field is created
//          (array or object is known as field) wgile querying a field "$" prefix should be added

// 3rd nested pp : joining with video with user model to get owner details such as his full name etc.. -- array of objects containing channel id's
// 4th pp : adding fields to the resultant o/p
// 5th pp : it is similar to SELECT query in SQL to show no of fields in the resultant query

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user?._id) }
        },
        {
            $lookup: {
                from: "videos", // model name should be plural & in lowercase
                localField: "watchHistory",
                foreignField: "_id",
                as: "history",
                // nested pipeline
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // User model name should be plural & in lowercase
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // nested pipeline to get only selected fields of user model
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            // since above nested pipeline returns an array of ssingle object with owner details in frondend 
                            // it will be problem so selecting the 1st element of that array and storing it in owner below
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                ]
            }
        }
    ])

    console.log(user, "history details")

    return res
        .status(200)
        .json(new APIResponse(200, user[0].history, "Watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUserDetails,
    updateAcountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory
}