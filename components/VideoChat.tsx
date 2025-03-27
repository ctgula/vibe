import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";

export function VideoChat({ roomId, userId }: { roomId: string; userId: string }) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isInCall, setIsInCall] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize PeerJS
  useEffect(() => {
    if (!isInCall) return;

    const newPeer = new Peer(userId);
    setPeer(newPeer);

    // Handle peer open event
    newPeer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      // Join the room
      joinRoom();
    });

    // Handle incoming calls
    newPeer.on("call", (call) => {
      if (localStream) {
        call.answer(localStream);
        handleCall(call);
      }
    });

    // Clean up
    return () => {
      newPeer.destroy();
    };
  }, [isInCall, userId]);

  // Get local media stream
  useEffect(() => {
    if (!isInCall) return;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    };

    getMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isInCall]);

  // Join the room
  const joinRoom = async () => {
    try {
      // Fetch all peers in the room
      const response = await fetch(`/api/rooms/${roomId}/peers`);
      const data = await response.json();
      const roomPeers = data.peers.filter((p: string) => p !== userId);
      setPeers(roomPeers);

      // Connect to each peer
      if (localStream) {
        roomPeers.forEach((peerId: string) => {
          if (peer) {
            const call = peer.call(peerId, localStream);
            handleCall(call);
          }
        });
      }

      // Register this peer in the room
      await fetch(`/api/rooms/${roomId}/peers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ peerId: userId }),
      });
    } catch (err) {
      console.error("Failed to join room", err);
    }
  };

  // Handle incoming and outgoing calls
  const handleCall = (call: any) => {
    call.on("stream", (stream: MediaStream) => {
      // Add remote stream
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.set(call.peer, stream);
        return newStreams;
      });

      // Add peer to the list if not already there
      setPeers((prev) => {
        if (!prev.includes(call.peer)) {
          return [...prev, call.peer];
        }
        return prev;
      });
    });

    call.on("close", () => {
      // Remove remote stream
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(call.peer);
        return newStreams;
      });

      // Remove peer from the list
      setPeers((prev) => prev.filter((p) => p !== call.peer));
    });
  };

  return (
    <div className="video-chat-container">
      <h2>Video Chat</h2>
      {isInCall ? (
        <div className="video-grid">
          <div className="video-container local-video">
            <video
              ref={localVideoRef}
              muted
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%" }}
            />
            <p>You</p>
          </div>
          <div className="remote-videos">
            {Array.from(remoteStreams).map(([peerId, stream]) => (
              <div key={peerId} className="video-container">
                <video
                  ref={(video) => {
                    if (video) {
                      video.srcObject = stream;
                      video.play();
                    }
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
                <p>User {peerId}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setIsInCall(false)}>Leave Call</button>
        </div>
      ) : (
        <button onClick={() => setIsInCall(true)}>Join Video Call</button>
      )}
    </div>
  );
}