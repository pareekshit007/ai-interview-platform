import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "https://ai-interview-platform-rwh2.onrender.com";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = ({ code, as, name }) => {
  const [connected,    setConnected]    = useState(false);
  const [peerPresent,  setPeerPresent]  = useState(false);
  const [callActive,   setCallActive]   = useState(false);
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn,        setMicOn]        = useState(true);
  const [camOn,        setCamOn]        = useState(true);
  const [error,        setError]        = useState("");
  const [roomData,     setRoomData]     = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const socketRef           = useRef(null);
  const pcRef               = useRef(null);
  const pendingCandidates   = useRef([]);
  const localStreamRef      = useRef(null); // stable ref for cleanup
  const pendingListeners    = useRef([]);   // handlers queued before socket ready

  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => { setRemoteStream(e.streams[0]); setCallActive(true); };
    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit("webrtc:ice-candidate", { candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (["disconnected","failed","closed"].includes(pc.connectionState)) setCallActive(false);
    };
    pcRef.current = pc;
    return pc;
  }, []);

  useEffect(() => {
    if (!code || !as) return;
    let cancelled = false;

    (async () => {
      // ── Start local camera/mic ──
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        setError("Camera/microphone access denied. Please allow permissions and refresh.");
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      setLocalStream(stream);
      localStreamRef.current = stream;

      // ── Connect socket ──
      const socket = io(SIGNALING_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      // Flush any listeners that were registered before socket was ready
      pendingListeners.current.forEach(({ event, handler }) => socket.on(event, handler));
      pendingListeners.current = [];

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("room:join", { code, as, name });
      });

      socket.on("reconnect", () => {
        socket.emit("room:join", { code, as, name });
      });

      socket.on("room:joined", (data) => {
        setRoomData(data);
        setPeerPresent(!!data.peerPresent);
      });

      socket.on("room:error", ({ message }) => setError(message));

      socket.on("peer:joined", async ({ as: peerAs }) => {
        setPeerPresent(true);
        // Host creates offer when guest joins
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
        for (const c of pendingCandidates.current) { try { await pc.addIceCandidate(c); } catch {} }
        pendingCandidates.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { sdp: answer });
      });

      socket.on("webrtc:answer", async ({ sdp }) => {
        if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("webrtc:ice-candidate", async ({ candidate }) => {
        if (pcRef.current?.remoteDescription) {
          try { await pcRef.current.addIceCandidate(candidate); } catch {}
        } else {
          pendingCandidates.current.push(candidate);
        }
      });

      socket.on("chat:message", (msg) => setChatMessages((p) => [...p, msg]));
      socket.on("disconnect", () => setConnected(false));
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [code, as]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── onInterviewEvent: attach to socket immediately if ready, else queue ──
  const onInterviewEvent = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      return () => socketRef.current?.off(event, handler);
    } else {
      // Queue for when socket connects
      pendingListeners.current.push({ event, handler });
      return () => {
        pendingListeners.current = pendingListeners.current.filter(
          (l) => !(l.event === event && l.handler === handler)
        );
        socketRef.current?.off(event, handler);
      };
    }
  }, []);

  const emitInterviewEvent = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    socketRef.current?.emit("media:toggle", { kind: "mic", enabled: track.enabled });
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    socketRef.current?.emit("media:toggle", { kind: "cam", enabled: track.enabled });
  }, []);

  const sendChatMessage = useCallback((text) => {
    socketRef.current?.emit("chat:message", { text, from: name });
    setChatMessages((p) => [...p, { text, from: name, at: Date.now(), self: true }]);
  }, [name]);

  const hangUp = useCallback(() => {
    socketRef.current?.disconnect();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setCallActive(false);
  }, []);

  return {
    connected, peerPresent, callActive, localStream, remoteStream,
    micOn, camOn, error, roomData, chatMessages,
    toggleMic, toggleCam, sendChatMessage, hangUp,
    emitInterviewEvent, onInterviewEvent,
  };
};