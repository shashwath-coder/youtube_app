import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // fs=file system . this is used for file manipulation
import { ApiError } from "../utils/ApiError.js";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const upload_on_cloudinary= async(local_file_path)=>{
    try{
        if(!local_file_path) 
        {
            console.log("ERROR:file path not found");
            return null;
        }
        const response=await cloudinary.uploader.upload(local_file_path,{
            resource_type:"auto"
        })
        //console.log("file has been successfully uploaded onto cloudinary!",response.url);
        //console.log(response);

        fs.unlinkSync(local_file_path)
        return response;
    }
    catch(error){
        fs.unlinkSync(local_file_path)//remove the locally saved temporary file as the upload was unsuccessful
        return null;
    }
}
const get_public_url_id=async(url)=>{
    // cloudinary url eg-> "https://res.cloudinary.com/demo/image/upload/v1725001234/avatars/user123/avatar_abc.jpg" 
        try {
            if(!url) return;
            const url_parts=url.split('/')
            const end_part=url_parts.pop()
            const folder=url_parts.slice(url_parts.indexOf('upload')+1).join('/')
            const public_id=end_part.split('.')[0]
            const old_url_id=`${folder}/${public_id}`
        if(old_url_id)
        {
           await cloudinary.uploader.destroy(old_url_id)
        }
        } catch (error) {
            throw new ApiError(500,"Error while deleting the old avatar")
        }
}

const get_signed_video_url_from_url=async(url)=>{
    try{
        if(!url) return null;
        const url_parts=url.split('/')
        const end_part=url_parts.pop()
        const folder=url_parts.slice(url_parts.indexOf('upload')+1).join('/')
        const public_id=end_part.split('.')[0]
        const publicPath=folder?`${folder}/${public_id}`:public_id
        
        return cloudinary.url(publicPath,{
            resource_type:"video",
            secure:true,
            sign_url:true
        });
    }
    catch(error){
        return null;
    }
}
export {upload_on_cloudinary,
        get_public_url_id,
        get_signed_video_url_from_url
};