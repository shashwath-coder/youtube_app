import { asyncHandler } from "../utils/async_handler.js";

const register_user=asyncHandler(async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

/*     const register_user=async(req,res)=>{
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