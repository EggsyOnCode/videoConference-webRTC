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