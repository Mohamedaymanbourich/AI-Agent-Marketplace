import { v2 as cloudinary } from 'cloudinary'

const connectCloudinary = async () => {

    try{cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    }) ;
    console.log('Cloudinary configured successfully.');


} catch (err) {
        console.warn('Cloudinary configuration failed:', err && err.message ? err.message : err);
    }

}

export default connectCloudinary