import { Router } from "express";
import {login_user, register_user,logout_user, refresh_access_token} from "../controllers/user.controllers.js"

import {upload} from "../middlewares/multer.middleware.js"
import { verify_jwt } from "../middlewares/auth.middleware.js";
const router=Router()

router.route('/register').post(
    //below upload is how middlewares are injected
    // also this middleware(and middlewares in general) add more fields to the req.body
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
export default router