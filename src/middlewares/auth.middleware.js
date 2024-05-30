import jwt from "jsonwebtoken"
import { APIError } from "../utils/APIError.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new APIError(401, "Unautorized access")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        if (!decodedToken) {
            throw new APIError(401, "Invalid access token")
        }

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        req.user = user // pushing user in request
        next()
    } catch (error) {
        throw new APIError(401, error.message || "Invalid access token")
    }

})

export { verifyJWT }