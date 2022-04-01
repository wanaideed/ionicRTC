import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ToastController} from "@ionic/angular";
declare var RTCMultiConnection: any;

var connection = new RTCMultiConnection();
connection.socketURL = 'http://localhost:9001/';

connection.socketMessageEvent = 'video-broadcast-demo';

let streamID;

@Component({
  selector: 'app-join',
  templateUrl: './join.page.html',
  styleUrls: ['./join.page.scss'],
})
export class JoinPage implements OnInit {
  localVideo: HTMLMediaElement;
  roomID: any;
  micMute: boolean = false;
  constructor(public elementRef: ElementRef,private router: Router,private route: ActivatedRoute,
              private toastCtrl: ToastController) { }

  ngOnInit() {

  }

  ionViewDidEnter() {
    connection.dontAttachStream = true;
    connection.dontCaptureUserMedia = true;
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

      if(document.getElementById("myList").getElementsByTagName('video').length >= 1){
        document.getElementById("myList").innerHTML = "";
      }

      var video = document.createElement('video');
      video.srcObject = event.stream;

      video.setAttribute("style", "width: 450px")
      document.getElementById("myList").appendChild(video);
      video.play();
    }


    connection.onstreamended = function(event) {
      console.log("@@@@@@@")
    }

    connection.onMediaError = function(e) {
      alert()
    }

    this.route.paramMap.subscribe( params => {
      this.roomID = params.get('roomid');
      setTimeout(() => {
        connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        };

        connection.checkPresence(params.get('roomid'), function(isRoomExist, roomid) {
          console.log(isRoomExist)
          console.log(roomid)
          if (isRoomExist === true) {
            connection.join(roomid);
          } else {
            // connection.open(roomid);
          }
        });
      }, 500);
      console.log()
    })


  }

  recall() {
    this.micMute = false;
    connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    };

    connection.checkPresence(this.roomID, function(isRoomExist, roomid) {
      // console.log(isRoomExist)
      // console.log(roomid)
      if (isRoomExist === true) {
        connection.join(roomid);
      } else {
        this.toastctrl.create({
          message: "Connectivity not ready.",
          duration: 500,
          position: "top"
        }).then(toast => {
          toast.present();
        })
        // connection.open(roomid);
      }
    });
  }

  isMute() {
    return (this.micMute) ? "mic-off-outline" : "mic-outline"
  }

  muted() {
    this.micMute = !this.micMute;
    if (streamID != "") {
      (this.micMute) ? connection.streamEvents[streamID].stream.mute('audio') : connection.streamEvents[streamID].stream.unmute('audio');
    }
    // console.log(document.getElementById("myList").getElementsByTagName('video').length);
  }

  endCall() {
    try{
      // disconnect with all users
      connection.getAllParticipants().forEach(function(pid) {
        connection.disconnectWith(pid);
      });

      // stop all local cameras
      // connection.attachStreams.forEach(function(localStream) {
      //   localStream.stop();
      // });

      // close socket.io connection
      connection.closeSocket();

      window.close();
    }
    catch (e) {
      alert("Error Close")
    }
  }

  ngAfterViewInit() {
    this.localVideo  = this.elementRef.nativeElement.querySelector('#local-video');
  }

  closeSocket() {
    connection.closeSocket();
  }

  back() {
    this.router.navigate(['/']);
  }

}
