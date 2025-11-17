import mongoose from "mongoose";

// Connect to the MongoDB database
const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log('Database Connected'))

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn('MONGODB_URI not set; skipping database connection.');
        return;
    }

    if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
        console.warn('MONGODB_URI does not start with "mongodb://" or "mongodb+srv://"; skipping database connection.');
        return;
    }

    const connectString = /\/[^\/]+$/.test(uri) ? uri : `${uri}/agent-web`;
    await mongoose.connect(connectString);

}

export default connectDB