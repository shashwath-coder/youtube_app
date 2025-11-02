//require('dotenv').config({path:'./env'})// tthis also can be used but only when u dont do type:module in package.json
import dotenv from "dotenv"//very very important so tht all the env variables are available evrywhere in the code
import connectDB from "./db/index.js"


/* import mongoose from "mongoose"
import {DB_NAME} from "./constants.js" */

dotenv.config({
    path:"./env"
});




connectDB()// this is a async await call, and async await will always return promise which can be handled using .then ,.catch
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running on PORT ${process.env.PORT}`);
    })
})
.catch((error)=>
{
    console.log("mongodb connection failed");
})

// BELOW IS APPROACH 1

/* import express from "express"
const app=express()

(async()=>{
    try{
        await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        // This runs if the Express app emits an error (after successful DB connection)
        app.on("error",(error)=>{
            console.log("ERRR: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app listening on PORT: ${process.env.PORT}`);
            
        })
    }
    catch(error){
        console.log("ERROR: ",error);
        throw error 
    }
}) */