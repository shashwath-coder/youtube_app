import { Router } from "express";
import {register_user} from "../controllers/user.controllers.js"

import {upload} from "../middlewares/multer.middleware.js"
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
export default router