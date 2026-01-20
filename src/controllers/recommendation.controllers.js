import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Watch } from "../models/watch.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// POST /api/v1/recommendations/watch/:id
const record_watch_event = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid video id");

  const watched_duration = Number(req.body.watched_duration || req.body.watchedDuration || 0);
  const total_duration = Number(req.body.total_duration || req.body.totalDuration || req.body.total || 0);
  let percentage = 0;
  if (total_duration > 0) percentage = Math.min(1, watched_duration / total_duration);
  else if (req.body.percentage) percentage = Math.max(0, Math.min(1, Number(req.body.percentage)));

  // fetch video to capture tags and total duration if missing
  const video = await Video.findById(id).select("tags duration");
  if (!video) throw new ApiError(404, "Video not found");

  const watchData = {
    user: req.user._id,
    video: video._id,
    watched_duration: watched_duration || 0,
    total_duration: total_duration || video.duration || 0,
    percentage: percentage,
    tags: video.tags || []
  };

  // upsert user's watch record for this video
  await Watch.findOneAndUpdate(
    { user: req.user._id, video: video._id },
    { $set: watchData },
    { upsert: true, new: true }
  );

  // keep quick-access watch_history on user (most recent first)
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { watch_history: video._id } });
    await User.findByIdAndUpdate(req.user._id, { $push: { watch_history: { $each: [video._id], $position: 0, $slice: 100 } } });
  } catch (e) {
    console.error('watch_history update failed', e);
  }

  return res.status(200).json(new ApiResponse(200, null, "Watch event recorded"));
});

// GET /api/v1/recommendations/home
const get_home_recommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // gather user's watched tags weighted by percentage
  const watches = await Watch.find({ user: userId }).sort({ updatedAt: -1 }).limit(500).lean();

  if (!watches || watches.length === 0) {
    // fallback to popular videos
    const popular = await Video.find({ is_published: true }).sort({ views: -1 }).limit(20).populate("owner", "username full_name avatar");
    return res.status(200).json(new ApiResponse(200, { items: popular }, "Popular recommendations"));
  }

  // compute tag weights
  const tagWeights = new Map();
  const now = Date.now();
  for (const w of watches) {
    const recencyDays = Math.max(1, (now - new Date(w.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    const recencyWeight = 1 / Math.log(recencyDays + 1.7); // simple recency bias
    const weight = (w.percentage || 0) * recencyWeight;
    for (const t of (w.tags || [])) {
      tagWeights.set(t, (tagWeights.get(t) || 0) + weight);
    }
  }

  // pick top tags
  const sortedTags = Array.from(tagWeights.entries()).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const topTags = sortedTags.slice(0, 8);

  // exclude already watched videos
  const user = await User.findById(userId).select('watch_history').lean();
  const watchedIds = (user?.watch_history || []).map(String);

  // find candidate videos matching top tags
  const candidates = await Video.aggregate([
    { $match: { is_published: true, tags: { $in: topTags.map(t => t) }, _id: { $nin: watchedIds.map(id => mongoose.Types.ObjectId(id)) } } },
    { $addFields: { matchedTags: { $size: { $setIntersection: ["$tags", topTags] } } } },
    { $sort: { matchedTags: -1, views: -1, createdAt: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'users', localField: 'owner', foreignField: '_id', as: 'owner' } },
    { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
    { $project: { video_file:1, thumbnail:1, title:1, description:1, duration:1, views:1, tags:1, matchedTags:1, owner: { username:1, full_name:1, avatar:1 } } }
  ]);

  // if candidates are few, fallback to popular
  if (!candidates || candidates.length < 6) {
    const popular = await Video.find({ is_published: true, _id: { $nin: watchedIds } }).sort({ views: -1 }).limit(20).populate("owner", "username full_name avatar");
    return res.status(200).json(new ApiResponse(200, { items: popular }, "Recommendations (popular fallback)"));
  }

  return res.status(200).json(new ApiResponse(200, { items: candidates }, "Personalized recommendations"));
});

export { record_watch_event, get_home_recommendations };
