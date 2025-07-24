import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../context/UserContext";
import axios from "axios";

const Dashboard = () => {
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { user, token, logout } = useUser();

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    const savedRooms = JSON.parse(localStorage.getItem("recentRooms")) || [];
    setRecentRooms(savedRooms);
  }, []);

  const handleCreateRoom = async () => {
    if (!roomNameInput.trim()) {
      alert("Please enter a room name.");
      return;
    }

    const newRoomCode = uuidv4();

    try {
      const res = await axios.post(
        `${BASE_URL}/api/rooms/create`,
        {
          roomId: newRoomCode,
          roomName: roomNameInput.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 201 || res.data.message === "Room already exists") {
        const newRoom = { name: roomNameInput.trim(), code: newRoomCode };
        const updatedRooms = [newRoom, ...recentRooms].slice(0, 5);
        localStorage.setItem("recentRooms", JSON.stringify(updatedRooms));
        setRecentRooms(updatedRooms);
        navigate(`/room/${newRoomCode}`);
      } else {
        alert("Failed to create room.");
      }
    } catch (err) {
      console.error("Room creation error:", err);
      alert("Error creating room.");
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      alert("Please enter a room code.");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/rooms/join`,
        {
          roomId: roomCodeInput.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        const joinedRoom = {
          name: res.data.room?.roomName || "Untitled Room",
          code: roomCodeInput.trim(),
        };

        const updatedRooms = [
          joinedRoom,
          ...recentRooms.filter((r) => r.code !== joinedRoom.code),
        ].slice(0, 5);

        localStorage.setItem("recentRooms", JSON.stringify(updatedRooms));
        setRecentRooms(updatedRooms);
        navigate(`/room/${roomCodeInput.trim()}`);
      } else {
        alert("Room not found.");
      }
    } catch (err) {
      console.error("Room join error:", err);
      alert("Invalid or expired room code.");
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-6">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[#94AC02]">BingeMates</h2>
          <p className="text-sm text-gray-400 mt-1">
            Welcome, {user?.fullName || "User"}
          </p>
        </div>

        <div className="flex-1" />

        <div className="mt-auto">
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm font-medium bg-[#94AC02] hover:bg-[#7e9300] text-white rounded-lg transition"
          >
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 py-10 px-6 sm:px-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Create Room Section */}
          <div className="bg-white/5 p-6 rounded-2xl shadow-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>
            <input
              type="text"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              placeholder="Enter room name (e.g., Anime Night)"
              className="w-full px-4 py-3 mb-4 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
            />
            <button
              onClick={handleCreateRoom}
              className="w-full bg-[#94AC02] hover:bg-[#7e9300] text-white py-3 rounded-lg font-semibold shadow-md transition duration-300"
            >
              Create Room
            </button>
          </div>

          {/* Join Room Section */}
          <div className="bg-white/5 p-6 rounded-2xl shadow-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Join a Room by Code</h2>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="Enter room code"
              className="w-full px-4 py-3 mb-4 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02] transition"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full bg-[#94AC02] hover:bg-[#7e9300] text-white py-3 rounded-lg font-semibold shadow-md transition duration-300"
            >
              Join Room
            </button>
          </div>

          {/* Recently Joined Rooms */}
          {recentRooms.length > 0 && (
            <div className="bg-white/5 p-6 rounded-2xl shadow-xl border border-white/10">
              <h2 className="text-xl font-semibold mb-4">
                Recently Joined Rooms
              </h2>
              <ul className="space-y-3">
                {recentRooms.map((room, idx) => (
                  <li
                    key={idx}
                    onClick={() => navigate(`/room/${room.code}`)}
                    className="cursor-pointer bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition"
                  >
                    <div className="text-lg font-semibold text-white">
                      {room.name}
                    </div>
                    <div className="text-sm text-gray-400 break-all">
                      Code: {room.code}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
