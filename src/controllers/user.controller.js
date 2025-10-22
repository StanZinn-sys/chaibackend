import {asyncHandler} from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


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
    const existedUser = User.findOne({
        $or: [{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409,"User with username or email already exists! ")
    }
//4. Check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.flies?.avatar[1]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required! ")
    }

//5. upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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



})

export {registerUser}