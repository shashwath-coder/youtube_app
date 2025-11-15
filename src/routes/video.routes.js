import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verify_jwt } from "../middlewares/auth.middleware.js";
import { get_video, upload_video } from "../controllers/video.controllers.js";

const router = Router();

router.post(
    "/upload",
    verify_jwt,
    upload.fields([
        {name:"video",maxCount:1},
        {name:"thumbnail",maxCount:1}
    ]),
    upload_video

)/* It means:

“Hey multer, expect two file uploads in this request:

one field named video (only 1 file allowed)

one field named thumbnail (only 1 file allowed)”  */
//you definitely need upload.fields() here because you’re uploading two separate files (video + thumbnail) in one request.


router.route('/:id').get(verify_jwt,get_video) // without verify_jwt there will be no initialization of req.user=user ... so req.user will always be false
export default router;