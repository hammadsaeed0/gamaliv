import dotenv from "dotenv";
dotenv.config();

export const {
  APP_PORT,
  MONGO_URI,
  TOKEN_KEY,
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY,
} = process.env;
