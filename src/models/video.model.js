import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const video_schema=new Schema(
    {
        video_file:{
            type:Sting,//cloudinary url
            required:true
        },
        thumbnail:{
            type:Sting,//cloudinary url
            required:true
        },  
        title:{
            type:Sting,
            required:true
        },
        description:{
            type:Sting,
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
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },{timestamps:true}
)

video_schema.plugin(mongooseAggregatePaginate) // now we can write aggregation queries