import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";

const subscription_schema=new Schema(
    {
        subscriber:{
            type:mongoose.Schema.types.ObjectId, //one whose subscribing
            ref:"User"
        },
        channel:{
            type:mongoose.Schema.types.ObjectId, //one to whom "subscriber" is subscribing
            ref:"User"
        }
    }
    ,{timestamps:true})

export const subscription=mongoose.model("subscription",subscription_schema)