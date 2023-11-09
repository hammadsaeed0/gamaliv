import mongoose from "mongoose";

const Schema = mongoose.Schema;

const countrySchema = new Schema({
  country: {
    type: String,
    required: true,
  },
});

export const Country = mongoose.model("Country", countrySchema);
