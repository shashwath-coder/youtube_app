import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { subscription as Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const subscribe_channel = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  const subscriberId = req.user?._id;
  if (!subscriberId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel id");
  if (String(subscriberId) === String(channelId)) throw new ApiError(400, "Cannot subscribe to yourself");

  const channelUser = await User.findById(channelId).select("_id username avatar");
  if (!channelUser) throw new ApiError(404, "Channel not found");

  const exists = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });
  if (exists) {
    const count = await Subscription.countDocuments({ channel: channelId });
    return res.status(200).json(new ApiResponse(200, { subscribed: true, subscribers_count: count }, "Already subscribed"));
  }

  await Subscription.create({ subscriber: subscriberId, channel: channelId });
  const subscribers_count = await Subscription.countDocuments({ channel: channelId });

  return res.status(201).json(new ApiResponse(201, { subscribed: true, subscribers_count }, "Subscribed to channel"));
});

const unsubscribe_channel = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  const subscriberId = req.user?._id;
  if (!subscriberId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel id");

  const deleted = await Subscription.findOneAndDelete({ subscriber: subscriberId, channel: channelId });
  const subscribers_count = await Subscription.countDocuments({ channel: channelId });

  return res.status(200).json(
    new ApiResponse(200, { subscribed: !!deleted, subscribers_count }, deleted ? "Unsubscribed from channel" : "Was not subscribed")
  );
});

const get_subscriptions_feed = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const subs = await Subscription.find({ subscriber: userId }).select("channel -_id");
  const channelIds = subs.map((s) => s.channel).filter(Boolean);
  if (!channelIds.length) {
    return res.status(200).json(new ApiResponse(200, { items: [], page, limit, total: 0 }, "No subscriptions yet"));
  }

  const [items, total] = await Promise.all([
    Video.find({ owner: { $in: channelIds }, is_published: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "username full_name avatar"),
    Video.countDocuments({ owner: { $in: channelIds }, is_published: true })
  ]);

  return res.status(200).json(new ApiResponse(200, { items, page, limit, total }, "Subscription feed"));
});

const get_channel_videos = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(channelId)) throw new ApiError(400, "Invalid channel id");

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Video.find({ owner: channelId, is_published: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "username full_name avatar"),
    Video.countDocuments({ owner: channelId, is_published: true })
  ]);

  return res.status(200).json(new ApiResponse(200, { items, page, limit, total }, "Channel videos fetched"));
});

export {
  subscribe_channel,
  unsubscribe_channel,
  get_subscriptions_feed,
  get_channel_videos
};