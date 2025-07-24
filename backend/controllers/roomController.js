import Room from "../models/Room.js";

/**
 * POST /api/rooms/create
 * Body: { roomId, roomName }
 */
export const createRoom = async (req, res) => {
  try {
    const { roomId, roomName } = req.body;

    // Avoid duplicates
    if (await Room.findOne({ roomId })) {
      return res.status(200).json({ message: "Room already exists" });
    }

    const newRoom = new Room({ roomId, roomName });
    await newRoom.save();

    res.status(201).json({ message: "Room created", roomId });
  } catch (err) {
    console.error("Create Room Error:", err);
    res.status(500).json({ message: "Room creation failed" });
  }
};

/**
 * POST /api/rooms/join
 * Body: { roomId }
 */
export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.status(200).json({ message: "Room found", room });
  } catch (err) {
    console.error("Join Room Error:", err);
    res.status(500).json({ message: "Room join failed" });
  }
};
