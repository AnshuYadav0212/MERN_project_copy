import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/DBMS-project`;
    const uri =
      "mongodb+srv://anshuyad23:PcHxdSYXDrpNHalu@dbms-project.4z3vfuk.mongodb.net/DBMS-project";

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully Connected to MongoDB Atlas cloud");
  } catch (error) {
    console.error("Error in connecting to MongoDB Atlas cloud:", error);
    throw error;
  }
};

export default connectDB;

