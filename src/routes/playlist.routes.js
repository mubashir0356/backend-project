import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist } from "../controllers/playlist.controller.js";


const playlistRouter = Router()
playlistRouter.use(verifyJWT)

playlistRouter.route("/").post(createPlaylist)

export default playlistRouter