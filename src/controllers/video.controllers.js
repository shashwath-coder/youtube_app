import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { upload_on_cloudinary } from "../models/cloudinary.js";
import mongoose from "mongoose";

const upload_video=asyncHandler(async(req,res)=>{

    const video_path=req.file?.video?.[0].path;
    const thumbnail_path=req.file?.video?.[0].path;
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
    if(!uploaded_video_url) 
    {
        throw new ApiError(500,"Video upload failed")
    }

    const uploaded_thumbnail=await upload_on_cloudinary(thumbnail_path);
    if(!uploaded_thumbnail_url)
    {
        throw new ApiError(500,"Thumbnail upload failed")
    }

    const video=await Video.create({
        video_file:uploaded_video.url||uploaded_video.secure_url,
        thumbnail:uploaded_thumbnail.url||uploaded_thumbnail.secure_url,
        title,
        description:description,
        duration:uploaded_video.duration, // uploaded_video has duration property in it which cloudinary itself provides 
        owner:req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video uploaded!"))
})

export {
    upload_video
}