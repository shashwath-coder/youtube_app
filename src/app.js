import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" 


const app=express() // all req and res are done in express.. so all req and res will hv access to the below ,like json , cors, cookie etc

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())//cookie parser is for accessing browser cookies of the user and do crud operations on it

import user_router  from "./routes/user.routes.js" //Works perfectly, since you exported default router.

app.use('/api/v1/users',user_router); // so ones theres /users in the url , control gets passed to user.routes

import video_router from "./routes/video.routes.js"
app.use('/api/v1/videos',video_router)
export {app} // now i can use this anywhere without writing import statements etc for app