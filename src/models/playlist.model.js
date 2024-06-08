import mongoose, { Schema } from "mongoose";

// const videoSchema = new Schema(
//     {
//         video: {
//             type: Schema.Types.ObjectId,
//             ref: "Video"
//         }
//     }
// )

const playlistSchema = new Schema({
    name: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }]
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistSchema)