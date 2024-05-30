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
    const publicIdWithFormat = urlParts.splice(7, 3).join("/")
    // console.log(publicIdWithFormat, "PIDF")
    const publicId = publicIdWithFormat.split(".").slice(0, -1).join(".") // removed format
    // console.log(publicId, "pId")
    return publicId
}

// uploading file to cloudinary server from local server

const uploadToCloudinary = async (localFile) => {
    try {
        if (!localFile) return null

        let folder = ""
        if (localFile.mimetype.startsWith("image")) {
            folder = `images/${localFile.userName}`
        } else if (localFile.mimetype.startsWith("video")) {
            folder = `videos/${localFile.userName}`
        } else {
            folder = `others/${localFile.userName}`
        }

        const response = await cloudinary.uploader.upload(localFile.path, {
            resource_type: "auto",
            folder: folder // Set the folder based on file type
        })
        // console.log("File uploaded successfully as:", response.url);
        fs.unlinkSync(localFile.path) // removing the locally saved file as it is saved to cloudinary server
        return response
    } catch (error) {
        fs.unlinkSync(localFile.path) // removing the locally saved file since its failed to be uploaded
    }
}

const deleteFromClodinary = async (cloudinaryUrl) => {

    try {
        const publicId = getPublicIdFromUrl(cloudinaryUrl)
        const result = await cloudinary.uploader.destroy(publicId);
        return result
    } catch (error) {
        throw new APIError(500, "Something went wrong while deleting file")
    }
}

export { uploadToCloudinary, deleteFromClodinary }