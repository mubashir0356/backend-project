import { User } from "../models/user.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"

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
    const avatarLocalFile = req.files?.avatar[0]?.path
    let coverImgLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImgLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalFile) {
        throw new APIError(400, "Avatar file is required")
    }

    const avatar = await uploadToCloudinary(avatarLocalFile)
    const coverImage = await uploadToCloudinary(coverImgLocalPath)

    if (!avatar) {
        throw new APIError(500, "Something went wrong uploading avatar")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new APIError(500, "Something went wrong while registering user")
    }

    res.status(201).json(new APIResponse(200, createdUser, "User registered successfully"))
})

export { registerUser }