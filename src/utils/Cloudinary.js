import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: "dhi2j0arj", 
    api_key: 562491957988846, 
    api_secret: "TNg8-Q-38TypO8EpCU7lAA0mtdY"
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        //uploading file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        // console.log("File uploaded on cloudinary successfully!",response.url);
        fs.unlinkSync(localFilePath)
        return response;


    }
    catch(error)
    {
        fs.unlinkSync(localFilePath) //remove the file locally saved temporary file as the upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}
