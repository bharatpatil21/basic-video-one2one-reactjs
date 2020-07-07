import React, { useEffect, useState, useRef } from "react";
// import './App.css';
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Video = styled.video`
  border: 1px solid blue;
  width: 50%;
  height: 50%;
`;

function App() {
  const [yourID, setYourID] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();
  const roomId = "12121212";
  useEffect(() => {
    socket.current = io.connect("localhost:8000");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setStream(stream);
        socket.current.emit("join room", roomId);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });

    socket.current.on("yourID", (id) => {
      setYourID(id);
    });

    socket.current.on("allUsers", (users) => {
      console.log("users----", users);
      setUsers(users);
      // if(users) {
      //   users.forEach((userID) => {
      //   if (socket.current.id !== userID) {
      //     callPeer(userID)
      //   }
      // });
      // }
    });

    socket.current.on("hey", (data) => {
      console.log('hey----in--',data)
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
  }, []);

  function callPeer(id) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
        ],
      },
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: yourID,
      });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  }

  function acceptCall() {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      console.log('data--signal---',data)
      socket.current.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <video
        autoPlay
        style={{
          zIndex: 2,
          position: "absolute",
          right: 0,
          width: 200,
          height: 150,
          margin: "70px 10px 10px 10px",
          backgroundColor: "black",
        }}
        ref={userVideo}
      ></video>
    );
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <video
        autoPlay
        style={{
          zIndex: 1,
          position: "fixed",
          bottom: 0,
          minWidth: "100%",
          minHeight: "100%",
          backgroundColor: "black",
        }}
        ref={partnerVideo}
      ></video>
    );
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    );
  }

  let usersbtn;
  if (users && users.length > 0) {
    usersbtn = users.map((userId, index) => {
      if (userId === yourID) {
        return null;
      }
      return <button key={index} onClick={() => callPeer(userId)}>Call {userId}</button>;
    });
  } else {
    usersbtn = <span>No User connected</span>;
  }

  return (
    <Container>
      <Row>
        {UserVideo}
        {PartnerVideo}
      </Row>
      <Row>{usersbtn}</Row>
      <Row>{incomingCall}</Row>
    </Container>
  );
}

export default App;
