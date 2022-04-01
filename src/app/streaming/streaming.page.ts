import {Component, ElementRef, OnInit} from '@angular/core';
import {LoadingController, ModalController, Platform, ToastController} from "@ionic/angular";
declare var RTCMultiConnection: any;

var connection = new RTCMultiConnection();
connection.socketURL = 'http://192.168.5.224:9001/';

connection.socketMessageEvent = 'video-broadcast-demo';
let streamID = "";

@Component({
  selector: 'app-streaming',
  templateUrl: './streaming.page.html',
  styleUrls: ['./streaming.page.scss'],
})
export class StreamingPage implements OnInit {

  localVideo: HTMLMediaElement;
  stream: MediaStream;
  colorStreamBtn: any = 'primary';
  width: any;
  height: any;

  roomID: any = 'samadfansforever';
  name: any = "Samad Forever";

  micMute: boolean = false;

  cameraList: any =  [];
  cameraSet: number = 0;

  butnCamera: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    public elementRef: ElementRef,
    public platform: Platform,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
  ) { }

  micChanges() {
    this.micMute = !this.micMute;
    if (streamID != "") {
      (this.micMute) ? connection.streamEvents[streamID].stream.mute('audio') : connection.streamEvents[streamID].stream.unmute('audio');
    }
  }

  cameraChanges(){
    this.reset();

    (this.cameraSet == 0) ? this.cameraSet = 1 : this.cameraSet = 0;
    this.cameraOpen();
  }

  isMute() {
    return (this.micMute) ? "mic-off-outline" : "mic-outline"
  }

  async ionViewDidEnter() {
    try {

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      videoDevices.map(videoDevice => {
        this.cameraList.push(videoDevice["deviceId"]);
      })

      this.cameraOpen();

    }catch (e){
      console.log(e)
    }
  }

  cameraOpen() {
    try {
      // console.log(this.height , "########")
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          audio: !this.micMute, video: {
            deviceId: {exact: this.cameraList[this.cameraSet]}
          }
        }).then((stream) => {
          // console.log(this.cameraList[this.cameraSet])
          if (stream) {
            this.stream = stream;
            this.localVideo.srcObject = stream;
          } else {
            console.log("Fails get media Devices")
          }
        });
      } else {
        console.log("Fails get media Devices")
      }
    }
    catch(e) {
      console.log("Fails open camera")
    }
  }

  ngOnInit() {
  }

  async start() {
    if (this.colorStreamBtn == 'primary') {
      this.butnCamera = true;


      setTimeout( async ()=>{
        this.colorStreamBtn = 'danger' ;
      } , 200)

      this.startCallConfig();

    }else{
      this.reset();
      this.leavePage();

      this.modalCtrl.dismiss();
    }
  }

  async startCallConfig() {

    this.intialiazeRTC();

    connection.mediaConstraints = {
      audio: !this.micMute,
      video: {
        mandatory: {},
        optional: [{
          sourceId: this.cameraList[this.cameraSet]
        }]
      }
    };
    let toast = await this.loadingCtrl.create({
      message: "Connecting  ...",
      // duration: 200,
      spinner: 'circular'
    })
    await toast.present()


    connection.open(this.roomID, function (isRoomOpened, roomid, error){
      if(isRoomOpened === true){
        toast.dismiss()
      }
    });
  }

  ngAfterViewInit() {
    this.localVideo  = this.elementRef.nativeElement.querySelector('#local-video');
  }

  close() {
    this.modalCtrl.dismiss();

    this.reset();
    this.leavePage();
  }

  ionViewWillLeave () {
    this.reset();
    this.leavePage();
  }

  async intialiazeRTC() {
    connection.session = {
      audio: true,
      video: true,
      oneway: true
    }

    connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    };

    connection.iceServers = [];

    connection.onstream = function (event) {
      streamID = event.streamid; //get streamID
    }

    let toast = await this.toastCtrl.create({
      message: "Failed to RTC",
      position: 'top',
      duration: 500,
      color: 'danger'
    })


    connection.onMediaError = function(e) {
      toast.present();
      console.log("Media RTC get problem");
    }
  }

  reset() {
    this.stream.getTracks().forEach(function(track) {
      track.stop();
    });
    this.stream = null;
    this.localVideo.srcObject = null;

  }

  leavePage() {
    try{

      // disconnect with all users
      connection.getAllParticipants().forEach(function(pid) {
        connection.disconnectWith(pid);
      });

      // stop all local cameras
      connection.attachStreams.forEach(function(localStream) {
        localStream.stop();
      });

      // close socket.io connection
      connection.closeSocket();
    }
    catch (e) {
      alert("Error Close")
    }

  }

}
