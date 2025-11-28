import { asyncHandler } from "../utils/async_handler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"  // so this User can call mongodb and access its data how many ever times... just use rthis whereever u want
import { upload_on_cloudinary,get_public_url_id } from "../models/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const register_user=asyncHandler(async(req,res)=>{
     //get user details from frontend
     //validation - not empty
     //check if user already exists: username , email
     // check for images , check for avatar
     // upload them to cloudinary, avatar check if uploaded properly
     //create user object - create entry in db
     // remove password and refresh token field from response
     //check for user creation
     // return response

     const{username, email,password,full_name}=req.body  // in postman whatever we put in body , req.body will hv tht
     //console.log(req.body);
     
     if(full_name==="")
     {
        throw new ApiError(400,"fullname is required")
     }
     if(!email.includes("@"))
     {
        throw new ApiError(400,"enter correct email format")
     }
     if(password.length<8)
     {
        throw new ApiError(400,"password is too short. minimum 8 characters");
     }

     const existed_user=await User.findOne(
        {
           $or: [{email},{username}] // to check if the same username or email is already in the User database
        }
    )

    //console.log("this is the existed user -> ",existed_user._id);
    if(existed_user)
    {
        throw new ApiError (409,"given email or username is already taken")
    }

   /*  console.log("below is db data");
    console.log(User); */
    
    // below .files func is provided by multer and tht avatar and cover_image is present inside/included in the req 
    const avatar_local_path=req.files?.avatar?.[0]?.path;
    // Multer stores uploaded files in req.files as arrays (since multiple files can be uploaded per field).
// So, req.files.cover_image[0].path gives the local path of the first uploaded 'cover_image' file.
    const cover_image_local_path=req.files?.cover_image?.[0]?.path;

    // or u can check like below
    /* let cover_image_local_path;
    if(req.files&&Array.isArray(req.files.cover_image)&&req.files.cover_image.length>0)
    {
        cover_image_local_path=req.files.cover_image[0].path
    } */

    //console.log(req.files);
    
    if(!avatar_local_path)
    {
        throw new ApiError(400,"avatar file is required")
    }
    const avatar=await upload_on_cloudinary(avatar_local_path);
    const cover_img=await upload_on_cloudinary(cover_image_local_path);

    if(!avatar)
    {
        throw new ApiError(400,"avatar file is required")
    }

   const user= await User.create({
        full_name,
        avatar:avatar.url,
        cover_image:cover_img?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })

    //console.log(user);
    
    //below id is automatically added by mongodb into whatever u create
   // also removal of password and refresh token is done below...(exact same to write)
    const created_user=await User.findById(user._id).select(
    "-password -refresh_token"
   )

   if(!created_user)
   {
    throw new ApiError(500,"something went wrong while registering")
   }

   return res.status(201).json(
    new ApiResponse(200,created_user,"user registered successfully! ")
   )
})

const generate_access_and_refresh_tokens=async(user_id)=>{
    try {
        const user=await User.findById(user_id)
        const access_token=user.generate_access_token()
        const refresh_token=user.generate_refresh_token();

        user.refresh_token=refresh_token

        // this user.save will also lead to changes in the db
        await user.save({validateBeforeSave:false}) // this is smthng given by mongoose , so tht password is not asked everytime and saved , when only tokens are generated 
        
        return {access_token,refresh_token}
    } 
    catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh tokens")
    }
}
const login_user=asyncHandler(async(req,res)=>{
    //req body ->data
    //username or email
    // find the user
    //password check
    //access and refresh token
    //send cookie

    const{username,email,password}= req.body;
    if(!(username||email))
    {
        throw new ApiError(400,"username or email is required!")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user)
    {
        throw new ApiError(404,"user does not exist");
    }

    const is_password_valid=await user.is_password_correct(password)

    if(!is_password_valid)
    {
        throw new ApiError(401,"Invalid user credentials")
    }

   const{access_token,refresh_token}= await generate_access_and_refresh_tokens(user._id)

   user.access_token=access_token
   user.refresh_token=""
   user.password=""

   const options={ // this will lead to cookies being modifyable only in server and we can only see it in the browser
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("access_token",access_token,options)
   .cookie("refresh_token",refresh_token,options)
   .json(
    new ApiResponse(
        200,
        {
            user:user,access_token,refresh_token
        },
        "user logged in successfully"
    )
   )
})
/* if not using asyncc handler     
const register_user=async(req,res)=>{
        try{
            res.status(200).json({
        message:"ok"
    });
    }
    catch(error)
    {
        console.log("something went wrong!");
        return null;
    }
    } */

    const logout_user=asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            
                {$set:{
                    refresh_token:undefined
                }},
                {
                    new:true
                },

         )
    const options={ // this will lead to cookies being modifyable only in server and we can only see it in the browser
    httpOnly:true,
    secure:true
   }
   return res
   .status(200)
   .clearCookie("access_token",options)
   .clearCookie("refresh_token",options)
   .json(new ApiResponse(200,{},"User logged out"))
    })

    const refresh_access_token=asyncHandler(async(req,res)=>{

    const incoming_refresh_token=req.cookies.refresh_token||req.body.refresh_token

    console.log("Incoming refresh token:", incoming_refresh_token);
    
    if(!incoming_refresh_token)
    {
        throw new ApiError(401,"unauthorized access")
    }

    //BELOW will decode the token and verify with the refresh token secret present in .env
    try {
        const decoded_token=jwt.verify( 
            incoming_refresh_token,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decoded_token?._id)
    
        if(!user)
        {
            throw new ApiError(401,"invalid refresh token")
        }
    
        if(incoming_refresh_token !== user?.refresh_token)
        {
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {access_token,new_refresh_token}=await generate_access_and_refresh_tokens(user._id)
    
        return res
        .status(200)
        .cookie("access_token",access_token,options)
        .cookie("refresh_token",new_refresh_token,options)
        .json(
            new ApiResponse(
                200,
                {access_token,refresh_token:new_refresh_token},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message||"invalid refresh token")
    }
})

const change_curr_password=asyncHandler(async(req,res)=>{
    const {old_password,new_password} =req.body

    const user=await User.findById(req.user?._id)

    const is_password_correct=await user.is_password_correct(old_password)

    if(!is_password_correct)
    {
        throw new ApiError(400,"invalid old password")
    }

    user.password=new_password
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))

})

const get_curr_user= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully!"))
})

const update_acc_details=asyncHandler(async(req,res)=>{

    const user_id=req.user?._id
    const {full_name,email,username}=req.body


    const existingUser = await User.findById(user_id);

    /* if (!existingUser) {
    throw new ApiError(404, "User not found");
  } //since we r dng verify_jwt as a middleware before updating the acc details , we can skip this if statement
 */
   if (!email && !username && !full_name) {
    throw new ApiError(400, "At least one field (username, email, or full_name) is required to update");
  }

    if(username===existingUser.username || email===existingUser.email)
    {
        throw new ApiError(400, "Please provide a new username or email");
    }


    const updatedUser=await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set:{
            full_name:full_name||existingUser.full_name,
            email:email||existingUser.email,
            username:username || existingUser.username
           },
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,updatedUser,"account details updated successfully"))
});

const update_user_avatar=asyncHandler(async(req,res)=>{
    const avatar_local_path=req.file?.path

    if(!avatar_local_path)
    {
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar=await upload_on_cloudinary(avatar_local_path)

    let user=await User.findById(req.user?._id)

    const old_avatar_url=user?.avatar;
    if(!avatar.url)
    {
        throw new ApiError(400,"error while uploading avatar")
    }

    user = await User.findByIdAndUpdate(
        req.user?._id,
        {
        $set:{
            avatar:avatar.url
        }
    },
        {
            new:true
        }
    ).select("-password")

    await get_public_url_id(old_avatar_url)
    return res
    .status(200)
    .json(new ApiResponse(200,user,"user avatar updated"))
})
const update_user_cover_image=asyncHandler(async(req,res)=>{
    const cover_image_local_path=req.file?.path

    if(!cover_image_local_path)
    {
        throw new ApiError(400,"cover file is missing")
    }
    const cover_image=await upload_on_cloudinary(cover_image_local_path)

    if(!cover_image.url)
    {
        throw new ApiError(400,"error while uploading cover image")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
        $set:{
            cover_image:cover_image.url
        }
    },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"user cover image updated"))
})

/* const get_user_channel_profile=asyncHandler(async(req,res)=>{

    const {username}=req.params

    if(!username?.trim())
    {
        throw new ApiError(400,"username is missing")
    }

    console.log(username);
    const channel=await User.aggregate([
        //this is how pipelining is done
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",  //from current collection/db ie User
            foreignField:"channel",// field from the 'subscriptions' collection
            as:"subscribers"
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",  
            foreignField:"subscriber",
            as:"subscribed_to"
        }
    },
    {
        //this will add extra fields into User db
        $addFields:{
            subscbribers_count:{
                $size:"$subscribers" //$ put before subscribers , since its a field now
            },
            channels_subscribed_to_count:{
                $size:"$subscribed_to"
            }
        ,
        is_subscribed:{
            cond:{
                if:{$in :[req.user?.id,"subscribers.subscriber"]},
                then:true,
                else:false
            }
        }
    }
},
    {
        $project:
        {
            full_name:1,
            username:1,
            subscbribers_count:1,
            channels_subscribed_to_count:1,
            avatar:1,
            is_subscribed:1,
            cover_image:1,
            email:1
        }
    }
])
console.log(channel[0]);

if(!channel?.length)
{
    throw new ApiError(404,"channel does not exist")
}


return res
.status(200)
.json(
    new ApiResponse(200,channel[0],"user channel fetched successfully")
)
})
 */

const get_user_channel_profile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) throw new ApiError(400, "username is missing");

    // convert current user id to ObjectId once, or null if unauthenticated
    const currentUserId = req.user ?new mongoose.Types.ObjectId(req.user._id) : null;

    const channel = await User.aggregate([
        { $match: { username: username.toLowerCase() } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed_to"
            }
        },
        {
            // all computed fields must live under $addFields
            $addFields: {
                subscribers_count: { $size: "$subscribers" },
                channels_subscribed_to_count: { $size: "$subscribed_to" },
                // compute is_subscribed using $in against the array of subscriber ids
                is_subscribed: currentUserId
                    ? { $in: [currentUserId, "$subscribers.subscriber"] }
                    : false
            }
        },
        {
            $project: {
                full_name: 1,
                username: 1,
                subscribers_count: 1,
                channels_subscribed_to_count: 1,
                avatar: 1,
                is_subscribed: 1,
                cover_image: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) throw new ApiError(404, "channel does not exist");
    return res.status(200).json(new ApiResponse(200, channel[0], "user channel fetched successfully"));
});


const get_watch_history=asyncHandler(async(req,res)=>{
    const user_id=req.user?._id;
    const user= await User.findById(user_id).select("watch_history")
    console.log("loggedInUser:", user);

    if(!user_id) throw new ApiError(401,"Unauthorized");

    user
    .populate({
        path:"watch_history",
        select:"title thumbnail duration views video_file createdAt owner",
        populate:{
            path:"owner",
            select:"username full_name avatar"
        }
    });
    const watch_history=user?.watch_history||[];

    return res.status(200)
    .json(new ApiResponse(200,watch_history,"watch history fetched successfully"));
})


export{register_user,
    login_user,
    logout_user,
    refresh_access_token,
    change_curr_password,
    get_curr_user,
    update_acc_details,
    update_user_avatar,
    update_user_cover_image,
    get_user_channel_profile,
    get_watch_history
}