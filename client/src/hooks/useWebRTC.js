import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "https://ai-interview-platform-rwh2.onrender.com";

// Public STUN server (free, Google-hosted) — handles NAT traversal for most
// home/office networks. NOTE: this app does not configure a TURN server, so
// calls between peers on restrictive networks (some corporate firewalls,
// some mobile carriers) may fail to establish a direct connection. A TURN
// server (e.g. Twilio Network Traversal, Metered.ca) would fix this but
// requires a paid account — flagged here as a known limitation.
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * Manages the full lifecycle of a 2-person WebRTC video call inside a room.
 * @param {{ code: string, as: "host" | "guest", name: string }} params
 */
export const useWebRTC = ({ code, as, name }) => {
  const [connected, setConnected]       = useState(false);   // socket connected
  const [peerPresent, setPeerPresent]   = useState(false);   // other person in room
  const [callActive, setCallActive]     = useState(false);   // WebRTC connected
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn]               = useState(true);
  const [camOn, setCamOn]               = useState(true);
  const [error, setError]               = useState("");
  const [roomData, setRoomData]         = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const socketRef = useRef(null);
  const pcRef      = useRef(null);
  const pendingCandidates = useRef([]);

  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setCallActive(true);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("webrtc:ice-candidate", { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setCallActive(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  const startLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      setError("Camera/microphone access denied. Please allow permissions and refresh.");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!code || !as) return;
    let cancelled = false;

    (async () => {
      const stream = await startLocalMedia();
      if (cancelled || !stream) return;

      const socket = io(SIGNALING_URL, { path: "/socket.io", transports: ["websocket", "polling"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("room:join", { code, as, name });
      });

      socket.on("room:joined", (data) => {
        setRoomData(data);
        setPeerPresent(!!data.peerPresent);
      });

      socket.on("room:error", ({ message }) => setError(message));

      socket.on("peer:joined", async () => {
        setPeerPresent(true);
        // Host initiates the offer once guest joins
        if (as === "host") {
          const pc = pcRef.current || createPeerConnection(stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:offer", { sdp: offer });
        }
      });

      socket.on("peer:left", () => {
        setPeerPresent(false);
        setCallActive(false);
        setRemoteStream(null);
      });

      socket.on("webrtc:offer", async ({ sdp }) => {
        const pc = pcRef.current || createPeerConnection(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const c of pendingCandidates.current) await pc.addIceCandidate(c);
        pendingCandidates.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { sdp: answer });
      });

      socket.on("webrtc:answer", async ({ sdp }) => {
        const pc = pcRef.current;
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("webrtc:ice-candidate", async ({ candidate }) => {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(candidate); } catch { /* ignore late candidates */ }
        } else {
          pendingCandidates.current.push(candidate);
        }
      });

      socket.on("chat:message", (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socket.on("disconnect", () => setConnected(false));
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, as]);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    socketRef.current?.emit("media:toggle", { kind: "mic", enabled: track.enabled });
  }, [localStream]);

  const toggleCam = useCallback(() => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    socketRef.current?.emit("media:toggle", { kind: "cam", enabled: track.enabled });
  }, [localStream]);

  const sendChatMessage = useCallback((text) => {
    socketRef.current?.emit("chat:message", { text, from: name });
    setChatMessages((prev) => [...prev, { text, from: name, at: Date.now(), self: true }]);
  }, [name]);

  const emitInterviewEvent = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const onInterviewEvent = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const hangUp = useCallback(() => {
    socketRef.current?.disconnect();
    pcRef.current?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    setCallActive(false);
  }, [localStream]);

  return {
    connected, peerPresent, callActive, localStream, remoteStream,
    micOn, camOn, error, roomData, chatMessages,
    toggleMic, toggleCam, sendChatMessage, hangUp,
    emitInterviewEvent, onInterviewEvent,
  };
};