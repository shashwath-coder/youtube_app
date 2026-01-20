import mongoose,{Schema} from "mongoose";

const comment_schema=new Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
        required:true
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String,
        required:true,
        trim:true
    },
    parent:{
        type:Schema.Types.ObjectId,
        ref:"comment",
        default:null
    },
    likes:{
        type:Schema.type.ObjectId,
        ref:"User"
    },
    likes_count:{
        type:Number,
        default:0
    },
    is_deleted:{
        type:Boolean,
        default:false
    }
    
},{timestamps:true});

comment_schema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parent",
  justOne: false
});

comment_schema.set("toObject",{virtuals:true})
comment_schema.set("toJSON",{virtuals:true})
/* 
This tells Mongoose:

“Whenever this document is converted to JSON (for API response) or a plain JS object, include the virtual fields.” */

export const comment=mongoose.model("comment",comment_schema)