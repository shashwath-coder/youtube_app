import express from "express";
import { verify_jwt } from "../middlewares/auth.middleware.js";
import { record_watch_event, get_home_recommendations } from "../controllers/recommendation.controllers.js";

const router = express.Router();

// record a watch progress/stat ping from client
router.post('/watch/:id', verify_jwt, record_watch_event);

// get homepage recommendations for logged in user
router.get('/home', verify_jwt, get_home_recommendations);

export default router;
