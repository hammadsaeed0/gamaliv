import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userRoom = new Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model (assuming you have a User model)
    required: true,
  },
  title: {
    type: String,
  },
  roomImage: {
    type: String,
    required: true,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
    },
  ],
  seats: [
    {
      seatNumber: {
        type: Number,
        // unique: true, // Each seat must have a unique number
        min: 1, // Seat numbers must be positive
        max: 15, // Assuming there are 15 seats in the room
      },
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        default: null, // Initially, no one has booked the seat
      },
    },
  ],
});

export const Room = mongoose.model("Room", userRoom);
