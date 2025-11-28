import { Router } from "express";
import { verify_jwt } from "../middlewares/auth.middleware.js";
import {
  subscribe_channel,
  unsubscribe_channel,
  get_subscriptions_feed,
  get_channel_videos
} from "../controllers/subscription.controllers.js";

const router = Router();

// subscribe / unsubscribe
router.post("/channels/:id/subscribe", verify_jwt, subscribe_channel);
router.delete("/channels/:id/subscribe", verify_jwt, unsubscribe_channel);

// subscription feed for authenticated user
router.get("/feed/subscriptions", verify_jwt, get_subscriptions_feed);

// public channel videos
router.get("/channels/:id/videos", get_channel_videos);

export default router;