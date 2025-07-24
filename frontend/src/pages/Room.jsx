import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";

const Room = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const socketRef = useRef(null);
  const [participants, setParticipants] = useState(["You"]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [youtubeURL, setYoutubeURL] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const chatEndRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    console.log("Current location:", location.pathname);
  }, [location]);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(BASE_URL);
    const socket = socketRef.current;

    socket.emit("join-room", roomId);

    socket.on("chat-message", ({ sender, content }) => {
      setMessages((prev) => [...prev, { sender, content }]);
    });

    socket.on("video-change", (payload) => {
      const id = typeof payload === "string" ? payload : payload?.videoId;
      if (!id) return;
      setVideoId(id);
      createYouTubePlayer(id);
    });

    socket.on("video-control", ({ action, time ,sourceId}) => {
      if (!ytPlayerRef.current?.getPlayerState) return;
      if (sourceId === socketRef.current.id) return; 
      const player = ytPlayerRef.current;
      try {
        if (action === "play") {
          player.playVideo();
          if (time !== undefined) player.seekTo(time, true);
        } else if (action === "pause") {
          player.pauseVideo();
          if (time !== undefined) player.seekTo(time, true);
        } else if (action === "seek" && time !== undefined) {
          player.seekTo(time, true);
        }
      } catch (e) {
        console.error("Error controlling video:", e);
      }
    });

    return () => {
      socket.emit("leave-room", roomId);
      socket.disconnect();
      socket.off("chat-message");
      socket.off("video-change");
      socket.off("video-control");
    };
  }, [roomId]);

  const extractVideoId = (url) => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^\s&?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([^\s&]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const loadYouTubeAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }

      const script = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (script) {
        const check = () => {
          if (window.YT && window.YT.Player) resolve();
          else setTimeout(check, 50);
        };
        check();
        return;
      }

      const newScript = document.createElement("script");
      newScript.src = "https://www.youtube.com/iframe_api";
      newScript.async = true;
      newScript.onerror = () => reject(new Error("Failed to load YouTube API"));
      document.body.appendChild(newScript);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
        delete window.onYouTubeIframeAPIReady;
      };
    });
  };

  const createYouTubePlayer = async (videoId) => {
    try {
      setLoadingVideo(true);
      console.log("Creating YouTube player for video:", videoId);

      await loadYouTubeAPI();

      await new Promise((r) => setTimeout(r, 0));

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }

      const container = document.getElementById("ytplayer");
      if (container) container.innerHTML = "";

      ytPlayerRef.current = new window.YT.Player("ytplayer", {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0,
        },
        events: {
          onReady: () => {
            console.log("YouTube player ready");
            setLoadingVideo(false);
          },
          onStateChange: (e) => {
            const state = e.data;
            const sourceId = socketRef.current.id;
            if (state === window.YT.PlayerState.PLAYING) {
              socketRef.current.emit("video-control", {
                roomId,
                action: "play",
                time: e.target.getCurrentTime(),
                sourceId,
              });
            } else if (state === window.YT.PlayerState.PAUSED) {
              socketRef.current.emit("video-control", {
                roomId,
                action: "pause",
                time: e.target.getCurrentTime(),
                sourceId,
              });
            }
          },
          onError: (e) => {
            console.error("YouTube player error:", e.data);
            setLoadingVideo(false);
            const msgs = {
              2: "Invalid video ID",
              5: "HTML5 player error",
              100: "Video not found or private",
              101: "Video not allowed to be embedded",
              150: "Video not allowed to be embedded",
            };
            alert(`YouTube Error: ${msgs[e.data] || "Unknown error"}`);
          },
        },
      });
    } catch (err) {
      console.error("Error creating YouTube player:", err);
      setLoadingVideo(false);
      alert("Failed to load YouTube video. Please try again.");
    }
  };

  const handleYoutubeChange = async () => {
    const id = extractVideoId(youtubeURL);
    if (!id) {
      alert("Please enter a valid YouTube URL");
      return;
    }

    console.log("Loading video with ID:", id);
    setVideoId(id);
    setLoadingVideo(true);

    await createYouTubePlayer(id);
    socketRef.current.emit("video-change", { roomId, videoId: id });
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const sendMessage = () => {
    if (newMsg.trim()) {
      const messageData = {
        roomId,
        sender: user?.fullName || user?.email || "You",
        content: newMsg,
      };

      socketRef.current.emit("chat-message", messageData);
      setNewMsg("");
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      if (jitsiApiRef.current) {
        await jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
      socketRef.current?.emit("leave-room", roomId);
      socketRef.current?.disconnect();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error cleaning up:", error);
      navigate("/dashboard", { replace: true });
    } finally {
      setIsLeaving(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const me = user?.fullName || user?.email || "You";
    setParticipants([me]);

    const timer = setInterval(() => {
      if (!jitsiApiRef.current) return;
      clearInterval(timer);

      const jitsi = jitsiApiRef.current;

      const list = jitsi.getParticipantsInfo().map(p => p.displayName || p.participantId || 'Unknown').filter(Boolean);
      setParticipants(prev => [...new Set([me, ...list])]);

      const handleParticipantJoined = ({ participantId }) => {
        const participant = jitsi.getParticipantById(participantId);
        const name = participant?.displayName || participantId || 'Unknown';
        setParticipants(prev => [...new Set([...prev, name])]);
      };

      const handleParticipantLeft = ({ participantId }) => {
        const participant = jitsi.getParticipantById(participantId);
        const name = participant?.displayName || participantId || 'Unknown';
        setParticipants(prev => prev.filter(p => p !== name));
      };

      jitsi.on("participantJoined", handleParticipantJoined);
      jitsi.on("participantLeft", handleParticipantLeft);

      return () => {
        clearInterval(timer);
        if (jitsiApiRef.current) {
          jitsiApiRef.current.off("participantJoined", handleParticipantJoined);
          jitsiApiRef.current.off("participantLeft", handleParticipantLeft);
        }
      };
    }, 200);

  }, [roomId, user]);

  useEffect(() => {
    loadYouTubeAPI().catch(console.error);
  }, []);

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript();

        if (jitsiContainerRef.current && !jitsiApiRef.current) {
          const domain = "8x8.vc";
          const appID = import.meta.env.VITE_VPASS_APP_ID;
          const roomName = `${appID}/BingeMates_${roomId}`;

          jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, {
            roomName,
            parentNode: jitsiContainerRef.current,
            width: "100%",
            height: "100%",
            userInfo: {
              displayName: user?.fullName || user?.email || "You",
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              disableDeepLinking: true,
              enableUserRolesBasedOnToken: false,
              enableInsecureRoomNameWarning: false,
              prejoinPageEnabled: false,
              enableLobby: false,
              enableLobbyChat: false,
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              TOOLBAR_BUTTONS: ["microphone", "camera", "tileview"],
              TILE_VIEW_MAX_COLUMNS: 2,
              FILM_STRIP_ONLY: false,
              DISABLE_VIDEO_BACKGROUND: true,
              LOCAL_THUMBNAIL_RATIO: 1,
              REMOTE_THUMBNAIL_RATIO: 1,
              DEFAULT_REMOTE_DISPLAY_NAME: "Friend",
              DEFAULT_LOCAL_DISPLAY_NAME: user?.fullName || "You",
            },
          });

          jitsiApiRef.current.addEventListener("videoConferenceJoined", () => {
            setJitsiLoaded(true);
            jitsiApiRef.current.executeCommand("toggleTileView");
            jitsiApiRef.current.executeCommand("setTileView", true);
          });
        }
      } catch (error) {
        console.error("Failed to load Jitsi:", error);
      }
    };
    initializeJitsi();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomId, user]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden relative">
      <div className={`absolute top-4 z-50 transition-all duration-300 ${sidebarVisible ? "left-60" : "left-3.5"}`}>
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md shadow-md"
        >
          {sidebarVisible ? "✕" : "☰"}
        </button>
      </div>

      {sidebarVisible && (
        <div className="hidden md:flex flex-col w-64 bg-gray-950/70 border-r border-white/10 p-6">
          <h2 className="text-2xl font-bold text-[#94AC02] mb-6">BingeMates</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Room Code:</span>
              <span className="font-mono">{roomId}</span>
              <button
                onClick={handleCopyRoomCode}
                className="ml-auto text-sm text-[#94AC02] hover:underline"
              >
                📋
              </button>
            </div>
            <p className="text-gray-400">Participants:</p>
            <ul className="list-disc ml-6">
              {participants.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-grow min-h-[55vh] bg-black border-2 border-[#94AC02] rounded-xl overflow-hidden shadow-lg relative">
            <div id="ytplayer" className="w-full h-full" />
            {loadingVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#94AC02] mx-auto mb-2" />
                  <p className="text-gray-400">Loading video…</p>
                </div>
              </div>
            )}
            {!loadingVideo && !videoId && (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">Enter a YouTube link and click “Load Video”</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex w-full md:w-2/3 gap-2">
              <input
                type="text"
                value={youtubeURL}
                onChange={(e) => setYoutubeURL(e.target.value)}
                placeholder="Enter YouTube video URL"
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg placeholder-gray-400 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleYoutubeChange()}
              />
              <button
                onClick={handleYoutubeChange}
                disabled={loadingVideo}
                className="bg-[#94AC02] text-black px-4 py-2 rounded-lg hover:bg-[#7e9001] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingVideo ? "Loading..." : "Load Video"}
              </button>
            </div>
            <button
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className={`bg-white text-black px-5 py-2 rounded-lg font-semibold hover:bg-gray-200 ${isLeaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLeaving ? "Leaving..." : "Leave Room"}
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl shadow-xl flex flex-col h-[28vh] min-h-[180px] max-h-[30vh]">
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 text-sm bg-gray-900/50">
              <h3 className="font-semibold text-[#94AC02]">Chat</h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-400"> Room Code: {roomId}</span>
                <button
                  onClick={handleCopyRoomCode}
                  className="text-[#94AC02] text-xs px-2 py-1 border border-[#94AC02] rounded hover:bg-[#94AC02] hover:text-black"
                >
                  {copied ? "✔ Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">No messages yet</p>
              ) : (
                messages.map((msg, idx) => {
                  const isCurrentUser = msg.sender === (user?.fullName || user?.email || "You");
                  return (
                    <div key={idx} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-md break-words ${
                          isCurrentUser
                            ? 'bg-gray-700 text-white rounded-br-sm'
                            : 'bg-[#B8C957] text-black rounded-bl-sm'
                        }`}
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span
                            className={`font-semibold text-xs ${
                              isCurrentUser ? 'text-gray-300' : 'text-black/80'
                            }`}
                          >
                            {isCurrentUser ? 'You' : msg.sender || "Unknown"}
                          </span>
                          <span
                            className={`text-xs ${
                              isCurrentUser ? 'text-gray-400' : 'text-black/60'
                            }`}
                          >
                            {new Date().toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </span>
                        </div>
                        <div className="leading-relaxed text-sm word-wrap break-word overflow-wrap-anywhere">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/10 bg-gray-800/50">
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94AC02]/50 resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMsg.trim()}
                  className={`p-2.5 rounded-full font-medium transition-all duration-200 ${
                    newMsg.trim()
                      ? 'bg-[#94AC02] text-black hover:bg-[#7e9001] hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[320px] xl:w-[400px] flex flex-col bg-gray-900 border border-white/10 rounded-xl shadow-lg overflow-hidden min-h-[500px] max-h-[90vh]">
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg font-semibold text-[#94AC02]">Video Call</h3>
            {!jitsiLoaded && (
              <p className="text-xs text-gray-400 mt-1">Connecting to video call...</p>
            )}
          </div>
          <div
            ref={jitsiContainerRef}
            className="flex-1 w-full h-full flex flex-col"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Room;