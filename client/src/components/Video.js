import React, { useRef } from "react";

export const Video = ({ peer, switchvideo }) => {
  const ref = useRef();
  peer.on("stream", (stream) => {
    console.log("stream----", stream);
    ref.current.srcObject = stream;
  });
  return (
    <video
      autoPlay
      style={{
        maxHeight: 120,
        marginRight: 10,
        cursor: "pointer",
      }}
      onClick={() => switchvideo(ref.current.srcObject)}
      ref={ref}
    ></video>
  );
};
