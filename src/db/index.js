import mongoose, { connect } from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB=async()=>{
    try {
        const connection_instance=await mongoose.connect
        (`${process.env.DB_URL}/${DB_NAME}`)
        console.log(`yayy! mongodb connected DB_HOST: ${connection_instance.connection.host}`);
        
    } catch (error) {
        console.log("MONGO_DB connection FAILED ",error);
        process.exit(1)
    }
}

export default connectDB