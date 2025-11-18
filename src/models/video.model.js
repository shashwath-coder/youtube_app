import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const video_schema=new Schema(
    {
        video_file:{
            type:String,//cloudinary url
            required:true
        },
        thumbnail:{
            type:String,//cloudinary url
            required:true
        },  
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,//cloudinary url
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        is_published:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,// reference to a user
            ref:"User"
        },
        likes: [
          {
            type: Schema.Types.ObjectId,
            ref: "User"
          }
        ],
        dislikes: [
          {
            type: Schema.Types.ObjectId,
            ref: "User"
          }
        ],
        likes_count: { type: Number, default: 0 },
        dislikes_count: { type: Number, default: 0 },
    },{timestamps:true}
)

video_schema.plugin(mongooseAggregatePaginate) // now we can write aggregation queries

export const Video = mongoose.model("Video",video_schema);
