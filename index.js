let localstream;
let remotestream;
let peerConnection;
var STUN = {
  url: "stun:stun.l.google.com:19302",
};

var iceServers = {
  iceServers: [STUN],
};

const init = async () => {
  localstream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user-1").srcObject = localstream;
  createOffer();
};

let createOffer = async () => {
  peerConnection = new RTCPeerConnection(iceServers);

  remotestream = new MediaStream();
  document.getElementById("user-2").srcObject = remotestream;

  //we are getting video feed from localstream and passing it to PeerConnection to send it over to our remote peer
  localstream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localstream);
  });

  // this is an event listener ; so when peerconnection receives media streams the event "e" is fired which contaons media data; we fetch tracjs from it and add it to remoteStream obj so taht it maybe dispalyed
  peerConnection.ontrack = (e) => {
    e.streams[0].getTracks.forEach((track) => {
      remotestream.addTrack(track);
    });
  };

  //this func is triggered when program reaches "setLocalFescr" func below cuz when SDP is created stun servers also send ICE candidates and ICE server config to the local peer which passes it over to remote peer
  peerConnection.onicecandidate = () => {
    console.log("ice candidates are ", peerConnection.localDescription);
  };
  //local peer creating offer to be sent over to remote peer ;
  let offer = await peerConnection.createOffer();
  // local desc is the SDP by local to be sent over to remote { for signaling or invitation to accept teh stream}
  await peerConnection.setLocalDescription(offer); // triggers addICeCandidate func

  console.log("offer: ", offer);
};

init();

/*
questions:

why is SDP created at the end of teh func; when singaling should be done as the first thing and then peerConnection be established?
*/
