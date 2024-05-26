import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

export { uploadToCloudinary }