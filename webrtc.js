/*
webrtc is an encapsulation of the webrtc implementation protocols; setting up remote connection with a peer; communicating via a signaling server; 
sending ICE candidates; sedning SDP offers and setting local and remote SDP desc
and relaying streams between the participants

This class extends EventTarget 
In the event listeners of HTML elem like Btns or video ; webRTC.method() will be called and webRTC.addEventListeners () will be listening to those events and will perform necessary actions

therefore; we also need custom emitter inside the class to emit the events; since its EventTarget such an implementation is a necessity

*/

"use strict";
class WebRTC extends EventTarget {
  constructor(socket, pcConfig = null) {
    super();
    this.socket = socket;
    this.pcConfig = pcConfig; // list of turn and stun servers
    //other field vars
    this.room;
    //streams refer to audio or video data
    this.streams = {};
    this.pc = {}; //peer connections
    this.localStream; //only one stream ; the video feed of a user
    this._id = null; //socket ID of the user

    //init socketListeners
    this.onSocketListeners();
  }

  //getters
  get getRoom() {
    return this.room;
  }
  get getLocalStream() {
    return this.localStream;
  }
  get getParticipants() {
    return Object.keys(this.pcs);
  }
  get getId() {
    return this._id;
  }

  //custom event emitter
  // for socket listeners
  emit(eventname, details) {
    this.dispatchEvent(eventname, {
      detail: details,
    });
  }

  //emitting events to socket listeners

  //ROOMs
  joinRoom(roomId) {
    if (this.room) {
      this.emit("notification", {
        notification: "Leave current room to join another",
      });
      return;
    }
    this.socket.emit("create or join", roomId);
  }

  gotStream() {
    if (this.room) {
      this._sendMessage({ type: "gotstream" }, null, this.room);
    } else {
      this._emit("notification", {
        notification: `Should join room before sending a stream.`,
      });
    }
  }

  //leave current room
  leaveRoom() {
    if (!this.room) {
      this.emit("notification", {
        notification: "You are already not in a room",
      });
      return;
    }
    this.socket.emit("leave room", roomId);
  }

  //getLocal Stream ; this func is triggered from the UI btn ; asks for permission ; setups up the media devices and init the localstream to the received stream
  //and returns it
  getLocalStream(audioContraints, videoConstraints) {
    return navigator.mediaDevices
      .getUserMedia({ audio: audioContraints, video: videoConstraints })
      .then((stream) => {
        this.localStream = stream;
        return stream;
      })
      .catch((err) => {
        this._emit("error", {
          error: new Error(`Can't get usermedia`),
        });
      });
  }

  //connection to peers
  createPeerConnection(socketId) {
    try {
      if (this.pc[socketId]) {
        console.log("connection already exists; skipping..");
        return;
      }
      this.pc[socketId] = new RTCPeerConnection();
      //after the connection obj is est we need to start sending ICE candidates to the remote peer
      //to be defined : handleICe, handleOnTrack
      this.pc[socketId].onicecandidate = this.handleICE.bind(this, socketId); //call to handleIceCandidate func
      //adding tracks to be transferred
      // onTrack is an event listener for the PC obj; when it's triggered it recevies an event obj which is then passed over to handleOnTrack
      //this passing of event obj occurs implicitly ; so we don't need to explicitly pass that
      this.pc[socketId].onTrack = this.handleOnTrack.bind(this, socketId);
    } catch (error) {
      this._emit("error", {
        error: new Error(`RTCPeerConnection failed: ${error.message}`),
      });
    }
  }

  //sending ICE cand.. to the remote peer
  handleICE(socketId, event) {
    if (event.candidate) {
      this.sendMsg(
        {
          type: "candidate",
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        },
        socketId
      );
    }
  }

  //emiting msg to socket; which will then transmit it to corresponding toId (socketID)
  sendMsg(message, toId = null, roomId = null) {
    this.socket.emit("message", message, toId, roomId);
  }

  //handleOnTrack
  handleOnTrack(socketId, event) {
    if (this.streams[socketId]?.id !== event.streams[0].id) {
      this.streams[socketId] = event.streams[0];

      this._emit("newUser", {
        socketId,
        stream: event.streams[0],
      });
    }
  }

  connect(socketId) {
    if (this.localStream) {
      //making an RTCPeerConnection object
      this.createPeerConnection(socketId);
      //adding our local stream to this peer connection
      this.pc[socketId].addStream(this.localStream);
      //create SDP offer
      // makeOffer creates ice candidates which are to be sent over to remote peer ; which would be processed by handleICE func
      this.makeOffer(socketId);

      //essentially what's happening is :
      /*
      createPeerConnection is init an RTCPeerConnection obj ; which is stored in a pc {peer connections} Array ; then a mediaStream is being added onto that PC object 
      and then we are making SDP offer to our remote peer

      createPeerConnection func abstracts away the creation and transfer of ICE cand via a signaling server 
      and adding event listeners for receiving ice cand and receiving media streams from remote peer
      */
    } else {
      return;
    }
  }

  //////////////////////////////
  /*
  init socket.io listeners
  */
  onSocketListeners() {
    // Room was created by someone
    this.socket.on("created", (room, socketId) => {
      this._id = socketId;
      this.room = room;
      this.emit("createdRoom", { roomId: room });
    });

    // Join room
    this.socket.on("join", (room) => {
      this.room = room;
      this.emit("joinedRoom", { roomId: room });
    });

    // Leave the room
    this.socket.on("leave", (roomId) => {
      this.room = null;
      this.emit("leftRoom", { roomId: roomId });
    });

    //reacting to msgs received by socket
    this.socket.on("message", (message, socketId) => {
      //participant leaves
      if (message.type === "leave") {
        this.removeUser(socketId);
        this.emit("userLeave", {
          socketId: socketId,
        });
        return;
      }

      // Avoid dublicate connections
      if (
        this.pcs[socketId] &&
        this.pcs[socketId].connectionState === "connected"
      ) {
        return;
      }

      switch (message.type) {
        case "gotstream": // user is ready to share their stream
          this.connect(socketId);
          break;
        case "offer": // got connection offer
          if (!this.pcs[socketId]) {
            this.connect(socketId);
          }
          this.pcs[socketId].setRemoteDescription(
            new RTCSessionDescription(message)
          );
          this.answer(socketId);
          break;
        case "answer": // got answer for sent offer
          this.pcs[socketId].setRemoteDescription(
            new RTCSessionDescription(message)
          );
          break;
        case "candidate": // received candidate sdp
          const candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate,
          });
          this.pcs[socketId].addIceCandidate(candidate);
          break;
      }
    });
  }
}
