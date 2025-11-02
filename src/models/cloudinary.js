import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // fs=file system . this is used for file manipulation

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:CLOUDINARY_API_KEY,
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
        console.log("file has been successfully uploaded onto cloudinary!",response.url);
        return response;
    }
    catch(error){
        fs.unlink(local_file_path)//remove the locally saved temporary file as the upload was unsuccessful
        return null;
    }
}
export {upload_on_cloudinary};