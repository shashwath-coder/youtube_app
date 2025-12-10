import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verify_jwt } from "../middlewares/auth.middleware.js";
import { get_video,toggle_like, toggle_dislike, upload_video, stream_video, search_videos } from "../controllers/video.controllers.js";

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

router.route("/:id/like").post(verify_jwt, toggle_like);
router.route("/:id/dislike").post(verify_jwt, toggle_dislike);
router.route("/:id/stream").get(verify_jwt,stream_video);
router.route("/").get(search_videos);
export default router;