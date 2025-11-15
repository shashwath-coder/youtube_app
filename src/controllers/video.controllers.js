import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { upload_on_cloudinary } from "../models/cloudinary.js";
import mongoose from "mongoose";

const upload_video=asyncHandler(async(req,res)=>{

    const video_path=req.files?.video?.[0].path;
    const thumbnail_path=req.files?.thumbnail?.[0].path;
    if(!video_path)
    {
        throw new ApiError(400,"video file is required")
    }

    if(!thumbnail_path)
    {
        throw new ApiError(400,"thumbnail is required")
    }
    
    const {title,description}=req.body;

    if(!title || !description)
    {
        throw new ApiError(400,"title or description is missing")
    }

    const uploaded_video=await upload_on_cloudinary(video_path);
    if(!uploaded_video) 
    {
        throw new ApiError(500,"Video upload failed")
    }

    const uploaded_thumbnail=await upload_on_cloudinary(thumbnail_path);
    if(!uploaded_thumbnail)
    {
        throw new ApiError(500,"Thumbnail upload failed")
    }

    const duration = uploaded_video.duration || Number(req.body.duration) || 0;
    const video=await Video.create({
        video_file:uploaded_video.url||uploaded_video.secure_url,
        thumbnail:uploaded_thumbnail.url||uploaded_thumbnail.secure_url,
        title,
        description:description,
        duration, // uploaded_video has duration property in it which cloudinary itself provides 
        owner:req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201,video,"Video uploaded!"))
})

// ...existing code...
import { User } from "../models/user.model.js" // <--- added import
// ...existing code...

const get_video = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate id (previous code didn't guard early enough)
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Atomically increment views and return updated doc (previous code did this but checked is_owner before null-check)
    const video = await Video.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "username full_name avatar");

    // Check existence before using video.owner (previous bug: used video.owner before null-check)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Safer ownership check using mongoose ObjectId.equals (handles strings/ObjectIds)
    const is_owner =
        req.user && video.owner && video.owner._id
            ? video.owner._id.equals(req.user._id)
            : false;

    // If authenticated viewer is NOT the owner, add video to their watch_history:
    // - remove any existing reference (avoid duplicates)
    // - push to front ($position:0)
    // - cap to 100 entries ($slice)
    // (previously watch_history wasn't updated when non-owner viewed)
    console.log("req.user in get_video:", req.user);
    console.log("is_owner:", is_owner);

    if (req.user && !is_owner) {
        try {
            // $pull then $push — two quick ops (atomic multi-op transactions would be ideal for strict consistency)
            await User.findByIdAndUpdate(
                req.user._id,
                { $pull: { watch_history: video._id } },
                { useFindAndModify: false }
            );

            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $push: {
                        watch_history: {
                            $each: [video._id],
                            $position: 0,
                            $slice: 100
                        }
                    }
                },
                { useFindAndModify: false }
            );
        } catch (e) {
            // don't break the response if history update fails; log silently
            console.error("watch_history update failed", e);
        }
    }

    return res.status(200).json(new ApiResponse(200, { video, is_owner }, "Video fetched"));
});
export {
    upload_video,
    get_video
}