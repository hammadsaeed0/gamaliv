import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"], // Define the possible values as "active" or "inactive"
    default: "active", // Set the default status as "active"
  },
  profileImage: {
    type: String,
    required: true,
  },
  uniqueId: {
    type: String,
    unique: true,
    required: true,
  },
});

export const User = mongoose.model("User", userSchema);
