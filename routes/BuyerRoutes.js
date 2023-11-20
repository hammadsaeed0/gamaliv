import express from "express";
import {
  sendEmail,
  verifyOTP,
  sendConfirmEmail,
  changePassword,
  Register,
  Login,
  JoinRoom,
  SelectSeat,
  GetAllRooms,
  LeaveRoom,
  GetSingleRoom,
  DeleteRoom,
  UploadImage,
  CreateBanner,
  GetAllBanners,
  GetSingleBanner,
  addCountry,
  getCountry,
  DeleteCountry,
  GetAllUser,
  DeleteUser,
  UpdateUser,
  getMyAllRoom,
  deleteBanner,
  UpdateRoom,
  filterRoom,
} from "../controller/BuyerController.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" }); // Make sure to specify the destination directory

const router = express.Router();

router.route("/Register").post(Register);
router.route("/Login").post(Login);
router.route("/changePassword").post(changePassword);
router.route("/sendOTP").post(sendEmail);
router.route("/verify").post(verifyOTP);
router.route("/sendConfirmEmail").post(sendConfirmEmail);
router.route("/JoinRoom/:roomId").post(JoinRoom);
router.route("/getMyAllRoom/:userId").post(getMyAllRoom);
router.route("/deleteBanner/:bannerId").post(deleteBanner);
router.route("/SelectSeat/:roomId").post(SelectSeat);
router.route("/LeaveRoom/:roomId").post(LeaveRoom);
router.route("/UpdateRoom/:roomId").post(UpdateRoom);
router.route("/filterRoom").post(filterRoom);
router.route("/DeleteCountry/:countryId").post(DeleteCountry);
router.route("/GetSingleRoom/:roomId").post(GetSingleRoom);
router.route("/DeleteRoom/:roomId").post(DeleteRoom);
router.route("/GetSingleBanner/:bannerId").post(GetSingleBanner);
router.route("/DeleteUser/:userId").post(DeleteUser);
router.route("/GetAllRooms").get(GetAllRooms);
router.route("/GetAllUser").get(GetAllUser);
router.route("/CreateBanner").post(CreateBanner);
router.route("/getCountry").post(getCountry);
router.route("/GetAllBanners").get(GetAllBanners);
router.route("/addCountry").post(addCountry);
router.route("/UpdateUser/:userId").post(UpdateUser);
router.route("/UploadImage", upload.array("image")).post(UploadImage);

export default router;
