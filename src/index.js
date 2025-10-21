// require('dotenv').config({path:"./env"})
import dotenv from 'dotenv'
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js";

import express from "express";
import connectDB from "./db/dbconnect.js";
const app = express()

dotenv.config({
    path: './env'
})

connectDB();























/*
;( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port : ${process.env.PORT}`);
        })
    } catch(error){
      console.log("ERROR: ",error)
      throw error
    }
})()

*/
