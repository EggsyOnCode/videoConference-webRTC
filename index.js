let localstream;
let remotestream;

const init = async()=>{
    localstream = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    document.getElementById('user-1').srcObject = localstream;
    

}

init();