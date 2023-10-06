/*
webrtc is an encapsulation of the webrtc implementation protocols; setting up remote connection with a peer; communicating via a signaling server; 
sending ICE candidates; sedning SDP offers and setting local and remote SDP desc
and relaying streams between the participants

This class extends EventTarget 
In the event listeners of HTML elem like Btns or video ; webRTC.method() will be called and webRTC.addEventListeners () will be listening to those events and will perform necessary actions

therefore; we also need custom emitter inside the class to emit the events; since its EventTarget such an implementation is a necessity

*/

class WebRTC extends EventTarget{
    constructor(
        socket,
        pcConfig = null
    ){
        super();
        this.socket = socket;
        this.pcConfig = pcConfig; // list of turn and stun servers
        //other field vars
        this.room;
        this.pc = {}; //peer connections
        this.localStream ; //only one stream ; the video feed of a user
        this._id = null; //socket ID of the user 

        //init socketListeners
        this.onSocketListeners();
    }

    //getters
    get getRoom(){
        return this.room; 
    }
    get getLocalStream(){
        return this.localStream;
    }
    get getParticipants(){
        return Object.keys(this.pcs)
    }
    get getId(){
        return this._id;
    }



}