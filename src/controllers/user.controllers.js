import { asyncHandler } from "../utils/async_handler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"  // so this User can call mongodb and access its data how many ever times... just use rthis whereever u want
import { upload_on_cloudinary } from "../models/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
export{register_user,
    login_user,
    logout_user,
    refresh_access_token
}