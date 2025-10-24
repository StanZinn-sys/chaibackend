import {asyncHandler} from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import multer from 'multer';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res) => {
//     steps:
// 1. Get user details from the frontend
const {fullName, email, username, password} = req.body

// 2. validation - not empty
if(
    [fullName,email,username,password].some((field) => field?.trim()==="")){
        throw new ApiError(400,"All fields are required! ")
    }
// 3. check if user already exist: email,username
    const existedUser = await User.findOne({
        $or: [{ username }, { email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with username or email already exists! ")
    }
//4. Check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required! ")
    }
    

//5. upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log(avatar)
    if(!avatar){
        throw new ApiError(400,"Avatar is required! ")
    }

//6. create an user object - create an entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) //using .select method we can remove password and refresh token from the response

//7. Check for user creation

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user! ")
    }

//8. return response

res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully! "))



})

const loginUser = asyncHandler(async (req,res) => {
//1. req body madhun data gheun ye

const {email, username, password} = req.body;

//2.username or email based login
if(!username && !email){
    throw new ApiError(400, "username or email is required! ")
}
//3.find the user
const user = await User.findOne({
    $or: [{email},{username}]
})

if(!user){
    throw new ApiError(404,"User Does Not Exist! ")
}
//4. password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials! ")
    }

//5. access and refresh token 
    
    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200, {user: loggedInUser,accessToken,refreshToken},
            "user logged in successfully! "
        )
    )

//6. send access and refresh token in the form of cookies





})

const logoutUser = asyncHandler(async(req,res) => {
    //find user id and fetch user object using that id
    //delete the refresh token from that user object to logout the user
    await User.findByIdAndUpdate(
        req.user._id,{
            $unset:{refreshToken: 1} //this removes the field from the document
        },
        {
            new: true
        }
    )

     const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User successfully logged out!"))


})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token not received! ")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token! ")
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true, secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed successfully! "))
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}