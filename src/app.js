import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" 


const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())//cookie parser is for accessing browser cookies of the user and do crud operations on it


export {app} // now i can use this anywhere without writing import statements etc for app