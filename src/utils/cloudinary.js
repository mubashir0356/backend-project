import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { APIError } from './APIError.js';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const getPublicIdFromUrl = (url) => {
    const urlParts = url.split("/")
    const publicIdWithFormat = urlParts.pop()
    const publicId = publicIdWithFormat.split(".").slice(0, -1).join(".") // removed format
    return publicId
}

// uploading file to cloudinary server from local server

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("File uploaded successfully as:", response.url);
        fs.unlinkSync(localFilePath) // removing the locally saved file as it is saved to cloudinary server
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // removing the locally saved file since its failed to be uploaded
    }
}

const deleteFromClodinary = async (cloudinaryUrl) => {

    try {
        const publicId = getPublicIdFromUrl(cloudinaryUrl)
        const result = await cloudinary.uploader.destroy(publicId);
        return result
    } catch (error) {
        throw new APIError(500, "Something went wrong while deleting old avatar")
    }
}

export { uploadToCloudinary, deleteFromClodinary }