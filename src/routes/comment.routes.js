import { Router } from "express";
import { verify_jwt } from "../middlewares/auth.middleware";

import { add_comment, delete_comment, get_comments, update_comment,toggle_like_comment} from "../controllers/comment.controllers";

const router=Router();

router.route("/videos/:id/comments").post(verify_jwt,add_comment);
router.route("/videos/:id/comments").get(get_comments);
router.route("/comments/:id").patch(verify_jwt,update_comment);
router.route("/comments/:id").delete(verify_jwt,delete_comment);
router.route("/comments/:id/like").post(verify_jwt,toggle_like_comment);