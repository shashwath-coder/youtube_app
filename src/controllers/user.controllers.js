import { asyncHandler } from "../utils/async_handler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"  // so this User can call mongodb and access its data how many ever times... just use rthis whereever u want
import { upload_on_cloudinary } from "../models/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
export{register_user}