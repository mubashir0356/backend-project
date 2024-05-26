import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp') // specify the destination folder here
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // specify the name of file -- should be unique else it will overwrite existing file
    }
})

export const upload = multer({ storage: storage })