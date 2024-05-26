import { User } from "../models/user.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"

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

    const loggedInUser = await User.findById(user._id)

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

export { registerUser, loginUser }