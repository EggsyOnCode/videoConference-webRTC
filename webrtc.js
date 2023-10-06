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
      .then((strem) => {
        this.localStream = stream;
        return stream;
      }).catch((err)=>{
         this._emit("error", {
           error: new Error(`Can't get usermedia`),
         });
      })
  }

  
}
