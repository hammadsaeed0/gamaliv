import mongoose from "mongoose";

const Schema = mongoose.Schema;

const bannerSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  //   title: {
  //     type: String,
  //     required: true,
  //   },
  //   description: {
  //     type: String,
  //     required: true,
  //   },
  type: {
    type: String,
    required: true,
    enum: ["header", "footer"], // Define the possible banner types
  },
  // Add any other fields you need for your banners
});

export const Banner = mongoose.model("Banner", bannerSchema);
