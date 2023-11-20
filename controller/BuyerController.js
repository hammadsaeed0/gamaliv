import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { User } from "../model/User.js";
import { Room } from "../model/Room.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { Banner } from "../model/Banner.js";
import { Country } from "../model/Country.js";

// import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
  cloud_name: "dqvagphon",
  api_key: "655117765172458",
  api_secret: "yQHOoSJ5oUN0TMZbDPtm2jX6Pe4",
});

export const Register = catchAsyncError(async (req, res, next) => {
  const {
    username,
    email,
    password,
    country,
    gender,
    phoneNumber,
    age,
    profileImage,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("User with this email already exists", 409));
  }

  const existingUser1 = await User.findOne({ phoneNumber });
  if (existingUser1) {
    return next(new ErrorHandler("User with this Number already exists", 409));
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  function generateUniqueId() {
    const uniqueId = Math.floor(10000000 + Math.random() * 90000000);
    return uniqueId.toString();
  }

  // Example usage:
  const uniqueId = generateUniqueId();
  // console.log(uniqueId); // This will log an 8-digit unique number

  // Create the user
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    country,
    gender,
    phoneNumber,
    age,
    uniqueId,
    profileImage,
  });

  // Create a room for the new user with seat numbers starting from 1
  const newRoom = await Room.create({
    host: newUser, // Set the host of the room to the newly created user
    seats: Array.from({ length: 15 }, (_, index) => ({
      seatNumber: index + 1,
      bookedBy: null,
    })),
    title: username,
    roomImage: profileImage,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully!",
    data: newUser,
    room: newRoom, // Include the created room in the response
  });
});

export const Login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }
  // console.log(user._id);
  const userId = user._id.toString();
  // console.log(userId);
  const rooms = await Room.find({
    $or: [{ host: userId }],
  });
  await Room.populate(rooms, { path: "host" });

  // await user.save();

  res
    .status(201)
    .json({ success: true, message: "Login Successfully!", user, rooms });
});

export const sendEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return next(new ErrorHandler("User Not Found", 409));
    }

    const verificationCode = Math.floor(10000 + Math.random() * 90000)
      .toString()
      .substring(0, 5);
    existingUser.otp = verificationCode;
    await existingUser.save();

    const transporter = nodemailer.createTransport({
      port: 465,
      host: "smtp.gmail.com",
      secure: true,
      auth: {
        user: "hammaddeveloper189@gmail.com",
        pass: "vvleopeoptowobxn",
      },
      secure: true,
    });

    const mailData = {
      from: '"Gama Liv" <hammaddeveloper189@gmail.com>',
      to: email,
      subject: "One time otp",
      text: "Forget Password",
      html: ` <!DOCTYPE html>
      <html>
      <head>
          <title>Password Reset</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
              }
    
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #ffffff;
                  border-radius: 10px;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
              }
    
              h2 {
                  color: #0056b3;
              }
    
              p {
                  color: #777777;
              }
    
              .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #007bff;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 4px;
              }
    
              .otp {
                  font-size: 24px;
                  color: #333333;
                  margin: 20px 0;
              }
    
              .footer {
                  margin-top: 20px;
                  text-align: center;
                  color: #999999;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Password Reset</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password. Your One-Time Password (OTP) is:</p>
              <div class="otp">${verificationCode}</div>
              <p>Please use this OTP to reset your password. If you did not request this reset, please ignore this email.</p>
              <p>Best regards,</p>
          </div>
       
      </body>
      </html>
    `,
    };

    const info = await transporter.sendMail(mailData);

    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};

export const sendConfirmEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });

    const transporter = nodemailer.createTransport({
      port: 465,
      host: "smtp.gmail.com",
      secure: true,
      auth: {
        user: "hammaddeveloper189@gmail.com",
        pass: "vvleopeoptowobxn",
      },
      secure: true,
    });

    const mailData = {
      from: '"Gama Liv" <hammaddeveloper189@gmail.com>',
      to: email,
      subject: "Welcome!",
      text: "We Noticed a New Login",
      html: ` <!DOCTYPE html>
      <html>
      <head>
          <title>We Noticed a New Login</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
              }
    
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #ffffff;
                  border-radius: 10px;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
              }
    
              h2 {
                  color: #0056b3;
              }
    
              p {
                  color: #777777;
              }
    
              .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #007bff;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 4px;
              }
    
              .otp {
                  font-size: 24px;
                  color: #333333;
                  margin: 20px 0;
              }
    
              .footer {
                  margin-top: 20px;
                  text-align: center;
                  color: #999999;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>We Noticed a New Login</h2>
          </div>
          <div class="footer">
              <p>This email was sent to you as part of our security measures.</p>
              <p>&copy; 2023 Gama. All rights reserved.</p>
          </div>
      </body>
      </html>
    `,
    };

    const info = await transporter.sendMail(mailData);

    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("User Not Found", 404));
    }

    if (user.otp !== otp) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }

    // // Hash the new password
    // const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

    // // Update the user's password to the hashed new password
    // user.password = hashedPassword;

    // Clear the stored OTP since it has been used
    user.otp = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("User Not Found", 404));
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

    // Update the user's password to the hashed new password
    user.password = hashedPassword;

    // Clear the stored OTP since it has been used
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};

export const JoinRoom = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params; // Assuming the room ID is passed as a route parameter
  const { userId } = req.body; // Assuming the user ID is passed in the request body

  try {
    // Check if the room exists
    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorHandler("Room not found", 404));
    }

    // Optionally, check if the user is already in the room
    const userAlreadyInRoom = room.users.includes(userId);
    if (userAlreadyInRoom) {
      return next(new ErrorHandler("User is already in the room", 400));
    }

    // Join the room by updating the user's ID in the room object
    room.users.push(userId);
    await room.save();

    res.status(200).json({
      success: true,
      message: "User joined the room successfully",
      data: room,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while joining the room", 500));
  }
});

export const SelectSeat = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params; // Assuming the room ID is passed as a route parameter
  const { userId, seatNumber } = req.body; // Assuming the user ID and seatNumber are passed in the request body

  try {
    // Check if the room exists
    const room = await Room.findById(roomId).populate("seats.bookedBy");

    if (!room) {
      return next(new ErrorHandler("Room not found", 404));
    }

    // Check if the user has already booked a seat in this room
    const userHasBookedSeatInRoom = room.seats.some((seat) => {
      return seat.bookedBy && seat.bookedBy._id.toString() === userId;
    });

    if (userHasBookedSeatInRoom) {
      return next(
        new ErrorHandler("User has already booked a seat in this room", 400)
      );
    }

    // Find the seat by seatNumber
    const selectedSeat = room.seats.find(
      (seat) => seat.seatNumber === seatNumber
    );

    if (!selectedSeat) {
      return next(new ErrorHandler("Seat not found", 404));
    }

    // Check if the seat is already booked
    if (selectedSeat.bookedBy) {
      return next(new ErrorHandler("Seat is already booked", 400));
    }

    // Book the seat for the user
    selectedSeat.bookedBy = userId;
    await room.save();

    res.status(200).json({
      success: true,
      message: "Seat booked successfully",
      data: selectedSeat,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while booking the seat", 500));
  }
});

export const GetAllRooms = catchAsyncError(async (req, res, next) => {
  try {
    // Fetch all rooms from the database
    const rooms = await Room.find().populate("host");

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching rooms", 500));
  }
});

export const LeaveRoom = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  try {
    // Check if the room exists
    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorHandler("Room not found", 404));
    }

    // Check if the user is in the room
    const userInRoom = room.users.includes(userId);
    if (!userInRoom) {
      return next(new ErrorHandler("User is not in the room", 400));
    }

    // Remove the user from the room
    room.users = room.users.filter((id) => id.toString() !== userId.toString());

    // Unbook seats that were booked by the user
    room.seats.forEach((seat) => {
      if (seat.bookedBy && seat.bookedBy.toString() === userId.toString()) {
        seat.bookedBy = null;
      }
    });

    await room.save();

    res.status(200).json({
      success: true,
      message: "User left the room and seats unbooked successfully",
      data: room,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while leaving the room", 500));
  }
});

export const GetSingleRoom = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;

  try {
    // Find the room by its ID
    // const room = await Room.findById(roomId);
    const room = await Room.findById(roomId).populate({
      path: "seats.bookedBy",
      model: "User",
      select: "username email phoneNumber profileImage", // Select the fields you want to populate
    });

    if (!room) {
      return next(new ErrorHandler("Room not found", 404));
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching the room", 500));
  }
});

export const DeleteRoom = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;

  try {
    // Find the room by its ID and delete it
    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return next(new ErrorHandler("Room not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
      data: deletedRoom,
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return next(new ErrorHandler("Error while deleting the room", 500));
  }
});

export const UploadImage = async (req, res, next) => {
  let images = [];
  if (req.files && req.files.image) {
    if (!Array.isArray(req.files.image)) {
      images.push(req.files.image);
    } else {
      images = req.files.image;
    }
  }
  let responce = [];
  for (const image of images) {
    try {
      const result = await cloudinary.v2.uploader.upload(image.tempFilePath);
      const publidId = result.public_id;
      const url = result.url;
      let data = {
        publidId,
        url,
      };
      //  console.log(data);
      responce.push(data);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: "Error uploading file", success: false });
    }
  }
  res.json({ success: true, data: responce });
};

export const CreateBanner = catchAsyncError(async (req, res, next) => {
  const { url, type } = req.body;
  try {
    // Create a new banner
    const newBanner = await Banner.create({ url, type });
    console.log(newBanner);
    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: newBanner,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while creating the banner", 500));
  }
});

export const GetAllBanners = catchAsyncError(async (req, res, next) => {
  try {
    // Find all banners
    const banners = await Banner.find();

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching banners", 500));
  }
});

export const GetAllUser = catchAsyncError(async (req, res, next) => {
  try {
    // Find all banners
    const user = await User.find();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching User", 500));
  }
});

export const GetSingleBanner = catchAsyncError(async (req, res, next) => {
  const { bannerId } = req.params;

  try {
    // Find the banner by its ID
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return next(new ErrorHandler("Banner not found", 404));
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching the banner", 500));
  }
});

export const GetSingleBanner1 = catchAsyncError(async (req, res, next) => {
  const { bannerId } = req.params;

  try {
    // Find the banner by its ID
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return next(new ErrorHandler("Banner not found", 404));
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching the banner", 500));
  }
});

export const addCountry = catchAsyncError(async (req, res, next) => {
  const { country } = req.body;
  try {
    // Create a new banner
    const newCountry = await Country.create({ country });
    console.log(newCountry);
    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: newCountry,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while creating the banner", 500));
  }
});

export const getCountry = catchAsyncError(async (req, res, next) => {
  try {
    // Find all banners
    const country = await Country.find();

    res.status(200).json({
      success: true,
      data: country,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching banners", 500));
  }
});

export const DeleteCountry = catchAsyncError(async (req, res, next) => {
  const { countryId } = req.params;

  try {
    // Find the room by its ID and delete it
    const deletedCountry = await Country.findByIdAndDelete(countryId);

    if (!deletedCountry) {
      return next(new ErrorHandler("Country not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Country deleted successfully",
      data: deletedCountry,
    });
  } catch (error) {
    // console.error("Error deleting room:", error);
    return next(new ErrorHandler("Error while deleting the country", 500));
  }
});

export const DeleteUser = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Find the room by its ID and delete it
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    // console.error("Error deleting room:", error);
    return next(new ErrorHandler("Error while deleting the User", 500));
  }
});

export const UpdateUser = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  const { username, country, gender, age, profileImage } = req.body;

  // Find the banner by its ID
  const existingUser = await User.findById(userId);

  if (!existingUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  existingUser.username = username || existingUser.username;
  existingUser.country = country || existingUser.country;
  existingUser.gender = gender || existingUser.gender;
  existingUser.age = age || existingUser.age;
  existingUser.profileImage = profileImage || existingUser.profileImage;
  await existingUser.save();

  res.status(201).json({
    success: true,
    message: "User Updated successfully!",
    data: existingUser,
  });
});

export const getMyAllRoom = catchAsyncError(async (req, res, next) => {
  const userId = req.params.userId;

  try {
    // Find all rooms where the user is the host or a member
    const rooms = await Room.find({
      $or: [{ host: userId }],
    });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while fetching user's rooms", 500));
  }
});

export const deleteBanner = catchAsyncError(async (req, res, next) => {
  const bannerId = req.params.bannerId;

  try {
    // Find the banner by its ID and delete it
    const banner = await Banner.findByIdAndDelete(bannerId);

    if (!banner) {
      return next(new ErrorHandler("Banner not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler("Error while deleting banner", 500));
  }
});

export const UpdateRoom = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params; // Assuming the room ID is passed as a route parameter
  const { title, roomImage } = req.body; // Assuming the new title and room image URL are passed in the request body

  try {
    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorHandler("Room not found", 404));
    }

    // Update the room properties
    room.title = title || room.title; // Update the title if provided, otherwise keep the existing title
    room.roomImage = roomImage || room.roomImage; // Update the room image if provided, otherwise keep the existing image

    // Save the updated room
    await room.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while updating the room", 500));
  }
});

export const filterRoom = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params; // Assuming the room ID is passed as a route parameter
  const { title, roomImage } = req.body; // Assuming the new title and room image URL are passed in the request body

  try {
    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return next(new ErrorHandler("Room not found", 404));
    }

    // Update the room properties
    room.title = title || room.title; // Update the title if provided, otherwise keep the existing title
    room.roomImage = roomImage || room.roomImage; // Update the room image if provided, otherwise keep the existing image

    // Save the updated room
    await room.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    return next(new ErrorHandler("Error while updating the room", 500));
  }
});
