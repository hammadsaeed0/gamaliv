import express from "express";
import { connectDB } from "./config/database.js";
import { APP_PORT } from "./config/index.js";
import BuyerRoutes from "./routes/BuyerRoutes.js";
import ErrorMiddleware from "./middleware/Error.js";
import fileupload from "express-fileupload";
import { createServer } from "http";
import { Server } from "socket.io";
import { Room } from "./model/Room.js";
import { User } from "./model/User.js";
import cors from "cors";
import ACTIONS from "./actions.js";
const app = express();
const server = createServer(app);
const io = new Server(server, {
  // cors: {
  //   origin: "https://gama-1b2c9abce5a9.herokuapp.com",
  //   methods: ["GET", "POST"],
  // },
  cors: {
    origin: "*",
  },
});

connectDB();

// Use Middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  fileupload({
    useTempFiles: true,
  })
);

app.use(cors());

// Import User Routes Hey
app.use("/v1", BuyerRoutes);

// Define a GET route that responds with a JSON message.
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// Sockets
const socketUserMap = {};

io.on("connection", (socket) => {
  console.log("New connection", socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
    socketUserMap[socket.id] = user;
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id,
        createOffer: false,
        user,
      });
      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId,
        createOffer: true,
        user: socketUserMap[clientId],
      });
    });
    socket.join(roomId);
  });

  socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
    io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
      peerId: socket.id,
      icecandidate,
    });
  });

  socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
    io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerId: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.MUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  socket.on(ACTIONS.UNMUTE, ({ roomId, userId }) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.UNMUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  socket.on(ACTIONS.MUTE_INFO, ({ userId, roomId, isMute }) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clients.forEach((clientId) => {
      if (clientId !== socket.id) {
        console.log("mute info");
        io.to(clientId).emit(ACTIONS.MUTE_INFO, {
          userId,
          isMute,
        });
      }
    });
  });

  socket.on(ACTIONS.JOIN_ROOM, async (data) => {
    // console.log("user data ====" > data?.roomId, data?.userId);

    const roomId = data?.roomId;
    const userId = data?.userId;
    try {
      const room = await Room.findById(roomId);

      if (!room) {
        return socket.emit(ACTIONS.JOIN_ROOM, {
          message: "Room not found!",
          status: "fail",
        });
      }

      const userAlreadyInRoom = room.users.includes(userId);
      if (userAlreadyInRoom) {
        return socket.emit(ACTIONS.JOIN_ROOM, {
          message: "User already in the room!",
          status: "fail",
        });
      }

      room.users.push(userId);
      await room.save();
      const user = await User.findById(userId);
      io.sockets.emit(ACTIONS.JOIN_ROOM, {
        status: "success",
        message: "User joins the room successfully",
        user: user,
        data: room,
      });
    } catch (error) {
      return socket.emit(ACTIONS.JOIN_ROOM, {
        message: "Error while joining the room!",
        status: "fail",
      });
    }
  });

  socket.on(ACTIONS.LEAVE_ROOM, async (data) => {
    // console.log("user data ====" > data?.roomId, data?.userId);

    const roomId = data?.roomId;
    const userId = data?.userId;
    try {
      const room = await Room.findById(roomId);

      if (!room) {
        return socket.emit(ACTIONS.LEAVE_ROOM, {
          message: "Room not found!",
          status: "fail",
        });
      }

      const userInRoom = room.users.includes(userId);
      if (!userInRoom) {
        return socket.emit(ACTIONS.LEAVE_ROOM, {
          message: "User is not in the room!",
          status: "fail",
        });
      }

      room.users = room.users.filter(
        (id) => id.toString() !== userId.toString()
      );

      room.seats.forEach((seat) => {
        if (seat.bookedBy && seat.bookedBy.toString() === userId.toString()) {
          seat.bookedBy = null;
        }
      });

      await room.save();

      const user = await User.findById(userId);
      io.sockets.emit(ACTIONS.LEAVE_ROOM, {
        status: "success",
        message: "User joins the room successfully",
        user: user,
        data: room,
      });
    } catch (error) {
      return socket.emit(ACTIONS.LEAVE_ROOM, {
        message: "Error while leaving the room!",
        status: "fail",
      });
    }
  });

  socket.on(ACTIONS.SELECT_SEAT, async (data) => {
    // console.log("user data ====" > data?.roomId, data?.userId);

    const roomId = data.roomId;
    const userId = data.userId;
    const seatNumber = data.seatNumber;

    try {
      // Check if the room exists
      const room = await Room.findById(roomId).populate("seats.bookedBy");

      if (!room) {
        return socket.emit(ACTIONS.SELECT_SEAT, {
          message: "Room not found!",
          status: "fail",
        });
      }

      // Check if the user has already booked a seat in this room
      const userHasBookedSeatInRoom = room.seats.some((seat) => {
        return seat.bookedBy && seat.bookedBy._id.toString() === userId;
      });

      if (userHasBookedSeatInRoom) {
        return socket.emit(ACTIONS.SELECT_SEAT, {
          message: "User has already booked a seat in this room!",
          status: "fail",
        });
      }

      const selectedSeat = room.seats.find(
        (seat) => seat.seatNumber === Number(seatNumber)
      );

      if (!selectedSeat) {
        return socket.emit(ACTIONS.SELECT_SEAT, {
          message: "Seat not found!",
          status: "fail",
        });
      }

      if (selectedSeat.bookedBy) {
        return socket.emit(ACTIONS.SELECT_SEAT, {
          message: "Seat is already booked!",
          status: "fail",
        });
      }

      selectedSeat.bookedBy = userId;
      await room.save();
      const user = await User.findById(userId);
      io.sockets.emit(ACTIONS.SELECT_SEAT, {
        status: "success",
        message: "Seat booked successfully",
        user: user,
        data: selectedSeat,
      });
    } catch (error) {
      return socket.emit(ACTIONS.SELECT_SEAT, {
        message: "Error while selecting the seat!",
        status: "fail",
      });
    }
  });
  socket.on("sendMessage", async (data) => {
    const userId = data.userId;
    const user = await User.findById(userId);
    io.sockets.emit("receiveMessage", {
      status: "success",
      user: user,
      data: data,
    });
  });
  const leaveRoom = () => {
    const { rooms } = socket;
    Array.from(rooms).forEach((roomId) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      clients.forEach((clientId) => {
        io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
          peerId: socket.id,
          userId: socketUserMap[socket.id]?.id,
        });

        // socket.emit(ACTIONS.REMOVE_PEER, {
        //     peerId: clientId,
        //     userId: socketUserMap[clientId]?.id,
        // });
      });
      socket.leave(roomId);
    });
    delete socketUserMap[socket.id];
  };

  socket.on(ACTIONS.LEAVE, leaveRoom);

  socket.on("disconnecting", leaveRoom);
});

// Start the server and listen on the specified port.
server.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port 8000`);
});
app.use(ErrorMiddleware);
