import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";

const subscription_schema=new Schema(
    {
        subscriber:{
            type:mongoose.Schema.types.ObjectId,
            ref:"User"
        },
        channel:{
            type:mongoose.Schema.types.ObjectId,
            ref:"User"
        }
    }
    ,{timestamps:true})

export const subscription=mongoose.model("subscription",subscription_schema)