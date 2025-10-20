import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Base de données MongoDB connectée avec succès");
  } catch (error) {
    console.error(" Erreur de connexion MongoDB :", error.message);
    process.exit(1);
  }
};

export default connectDB;
