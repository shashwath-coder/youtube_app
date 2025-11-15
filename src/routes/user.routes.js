import { Router } from "express";
import {login_user, 
        register_user,
        logout_user, 
        refresh_access_token, 
        change_curr_password, 
        get_curr_user, 
        update_acc_details,
        update_user_avatar, 
        update_user_cover_image, 
        get_user_channel_profile, 
        get_watch_history,
        } 
        from "../controllers/user.controllers.js"


import {upload} from "../middlewares/multer.middleware.js"
import { verify_jwt } from "../middlewares/auth.middleware.js";
const router=Router()

router.route('/register').post(
    //below upload is how middlewares are injected
    // also this middleware(and middlewares in general) add more fields to the req.body
    // Since multiple possible fields , so we need to write req.files in video controllers
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"cover_image",
            maxCount:1
        }
    ]),
    register_user)

router.route("/login").post(login_user)

router.route("/logout").post(verify_jwt,logout_user) // verify_jwt is the middleware whihc is injected before logout_user is executed

router.route("/refresh_token").post(refresh_access_token)

router.route("/change_password").post(verify_jwt,change_curr_password)
router.route("/current_user").get(verify_jwt,get_curr_user)
router.route("/update_account").patch(verify_jwt,update_acc_details) // write patch so tht not all details get overwritten, and only the ones which user wants to update gets updated
router.route("/avatar").patch(verify_jwt,upload.single("avatar"),update_user_avatar)
router.route("/cover_image").patch(verify_jwt,upload.single("cover_image"),update_user_cover_image)
router.route("/c/:username").get(verify_jwt,get_user_channel_profile)
router.route("/history").get(verify_jwt,get_watch_history)

export default router;