import mongoose,{Schema} from "mongoose";

const watch_schema=new Schema({
    user:{ type:Schema.Types.ObjectId, ref:"User", required:true, index:true },
    video:{ type:Schema.Types.ObjectId, ref:"Video", required:true, index:true },
    watched_duration:{ type:Number, default:0 }, // seconds
    total_duration:{ type:Number, default:0 }, // seconds (video duration)
    percentage:{ type:Number, default:0 }, // 0..1
    tags:[{ type:String }], // snapshot of video tags at watch time
},{timestamps:true})

watch_schema.index({ user:1, video:1 }, { unique: true })

export const Watch = mongoose.model("Watch", watch_schema);
