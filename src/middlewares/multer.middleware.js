import multer from "multer";

const multer=require('multer')

//cb ->callback , The callback function to tell Multer what to do next
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp")//No error, store this file in ./public/temp folder.
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const upload=multer({
    storage,
})