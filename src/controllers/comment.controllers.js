import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";


const add_comment=asyncHandler(async(req,res)=>{
    const video_id=req.params.id
    const user_id=req.user?._id
    const {text , parent}=req.body;

    if(!user_id)
    {
        throw new ApiError(401, "Unauthorized");
    }
    if(!text||!String(text).trim())
    {
        throw new ApiError(400, "comment text is required");
    }
    if (!mongoose.Types.ObjectId.isValid(video_id)) throw new ApiError(400, "Invalid video id");

    const video=await Video.findById(video_id).select("_id")
    if(!video)
    {
        throw new ApiError(404,"video not found");
    }

    if(parent)
    {
        if (!mongoose.Types.ObjectId.isValid(parent)) throw new ApiError(400, "Invalid parent comment id");
        const parent_comment=await Comment.findById(parent).select("_id")
        if(!parent_comment)
        {
            throw new ApiError(404,"parent comment not found");
        }
        if(String(parent_comment.video)!==String(video_id)) throw new ApiError(400,"parent comment does not belong to this video")
    }

    const comment = await Comment.create({
        video:video_id,
        user:user_id,
        text,
        parent:parent||null
    });

    return res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

const get_comments=asyncHandler(async(req,res)=>{
    const video_id=req.params.id;
    if(!mongoose.Types.ObjectId.isValid(video_id)) throw new ApiError(400, "Invalid video id");

    const comments=await Comment.find({video:video_id,parent:null,is_deleted:false})
    .sort({createdAt:-1})
    .populate("user","username full_name avatar")
    .populate({
        path:"replies",
        match:{is_deleted:false},
        options:{sort:{createdAt:-1}},
        populate:{path:"user",select:"username full_name avatar"}   
    })

    return res.status(200).json(new ApiResponse(200,comments,"comments fetched successfully"));
});

const update_comment=asyncHandler(async(req,res)=>{
    const comment_id=req.params.id;
    const {text}=req.body;
    if(!mongoose.Types.ObjectId.isValid(comment_id)) throw new ApiError(400, "Invalid comment id");
    if(!text||!String(text).trim()) throw new ApiError(400,"comment text is required");

    const comment=await Comment.findById(comment_id).select("user text is_deleted");
    if(!comment.user.equals(req.user._id))
    {
        throw new ApiError(403,"Not allowed to edit this comment");
    }
    comment.text=text;
    await comment.save();

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

const delete_comment = asyncHandler(async (req, res) => {
  const commentId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(commentId)) throw new ApiError(400, "Invalid comment id");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (!comment.user.equals(req.user._id)) throw new ApiError(403, "Not allowed to delete this comment");

  // soft delete
  comment.is_deleted = true;
  await comment.save();

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));
});

const toggle_like_comment=asyncHandler(async(req,res)=>{
    const comment_id=req.params.id

    if(!mongoose.Types.ObjectId.isValid(comment_id))
    {
        throw new ApiError(400,"Invalid comment id")
    }
    if(!req.user?._id)
    {
        throw new ApiError(401,"Unauthorized. Please login")
    }

    const comment=await Comment.findById(comment_id).select("likes likes_count")

    if(!comment)
    {
        throw new ApiError(404,"Comment not found")
    }

    const user_id_str=String(req.user._id)
    const liked =(comment.likes||[]).some((u)=>String(u)===user_id_str)

    if(liked)
    {
        await Comment.findById(comment_id,{$pull:{likes:req.user._id},$inc:{likes_count:-1}});
    }
    else{
        await Comment.findById(comment_id,{$addToSet:{likes:req.user._id},$inc:{likes_count:1}});
    }
    const updated=await Comment.findById(comment_id).select("likes likes_count")

    return res
    .status(200)
    .json(new ApiResponse(200,{liked:!liked,comment:updated}, "Toggle comment like"));
});

export{
    add_comment,
    get_comments,
    update_comment,
    delete_comment,
    toggle_like_comment
}