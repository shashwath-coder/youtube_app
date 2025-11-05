import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

// so when user logs in to his acc , he is provided with an access token...
// so while logging out , browser checks if the user has tht access token ie he is the one who logged in
// this prevents some random user from entering username and email in order to log out some other user from his acc

export const verify_jwt=asyncHandler(async(req,_,next)=>{
    //.cookies is given to it thru cookieParser()
    try {
        const token=req.cookies?.access_token||req.header("Authorization")?.replace("Bearer ","") // this is sent in the header part of the postman
    
        if(!token)
        {
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decoded_token=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
         
        const user=await User.findById(decoded_token._id).select("-password -refresh_token")
    
        if(!user)
        {
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user=user; // added user into the req , since access token is present with the user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message||"invalid access token")
    }
})