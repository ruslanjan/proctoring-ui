<template>
  <div v-if="!joined && !!user" class="p-justify-center p-align-center p-d-flex" style="flex-grow: 1; gap: 0.75em">
    <Button class="p-button-lg" v-if="loggedIn" @click="init">Присоеденится</Button>
    <div v-if="user.is_admin">
        <span class="p-float-label">
          <InputText id="room" v-model="roomId"/>
          <label for="room">Команта</label>
        </span>
    </div>
  </div>
  <div v-if="!!user && joined" class="p-m-4">
    <div>
      <h2>Прокторы:</h2>
      <div class="p-d-flex p-px-4 p-pb-3" style="gap: 0.75em">
        <div v-for="user in room.users_in_room.filter((user) => user.is_proctor)" :key="user.id">
          <span :class="`p-tag ${room.proctors[user.id]?'p-tag-danger-info':'p-tag-danger'}`">{{ user.name }}</span>
        </div>
      </div>
    </div>
    <div>
      <h2>Пользователи</h2>
      <div class="p-d-flex p-px-4 p-pb-3" style="gap: 0.75em">
        <div v-for="user in room.users_in_room.filter((user) => !user.is_proctor)" :key="user.id">
          <span :class="`p-tag ${room.users[user.id]?'':'p-tag-danger'}`">{{ user.name }}</span>
        </div>
      </div>
    </div>

    <video height="260" ref="localVideo" v-if="!user.is_proctor" autoplay></video>
    <video height="260" ref="localDisplayVideo" v-if="!user.is_proctor" autoplay></video>
    <video height="260" ref="remoteProctor" v-if="!user.is_proctor" autoplay></video>
    <!--    <audio ref="remoteAudio" autoplay v-if="!user.is_proctor"></audio>-->
    <div v-if="user.is_proctor">
      <h2>Пользователи:</h2>
      <div class="p-d-flex p-flex-wrap" style="gap: 0.75rem">
        <Card v-for="user in room.users" :key="user.id">
          <template #header>
            <video height="260" :ref="`remoteVideo_${user.id}`" playsinline autoplay></video>
            <video height="260" :ref="`remoteDisplayVideo_${user.id}`" playsinline autoplay></video>
          </template>
          <template #title>
            {{ user.name }}
          </template>
          <template #content>

          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script>
import { Socket } from "phoenix"
import ajax, { websocket_url } from "@/api/ajax";

const openMediaDevices = async (constraints) => {
  return await navigator.mediaDevices.getUserMedia(constraints);
}
const openDisplayDevices = async (constraints) => {
  return await navigator.mediaDevices.getDisplayMedia(constraints);
}

const servers = {
  "iceServers": [
    {
      urls: 'turn:proctor.iitu.kz:3478',
      credential: 'somepassword',
      username: 'guest',
    }, {
      urls: 'stun:proctor.iitu.kz:3478',
    }
    // {'urls': 'stun:stun.l.google.com:19302'}
  ],
  iceTransportPolicy: 'all'
};

export default {
  name: "Proctoring",
  computed: {
    loggedIn() {
      return this.$store.getters['loggedIn']
    },
    user() {
      return this.$store.getters['user']
    },
    token() {
      return this.$store.getters['token']
    },
  },
  data() {
    return {
      peers: {},
      roomId: 0,
      room: {
        proctors: {},
        users: {},
        users_in_room: []
      },
      localStream: null,
      localDisplayStream: null,
      socket: null,
      channel: null,
      joined: false,
    }
  },
  methods: {
    async closePeerConnectionWithUser(user) {
      if (this.peers[user.id]) {
        console.log("closing peer connection")
        await this.peers[user.id].close();
        delete this.peers[user.id];
      }
    },
    createProctorPeerConnection(receiver) {
      let peerConnection = new RTCPeerConnection(servers);
      console.log("Create local peer connection");
      peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          console.log("Local ICE Candidate: \n" + event.candidate.candidate);
          this.channel.push("iceCandidate", {
            body: {
              "iceCandidate": event.candidate,
              receiver: receiver,
              from: this.user,
            }
          });
        }
      });
      peerConnection.addEventListener('connectionstatechange', () => {
        console.log(`Peer connection with user ${receiver.username} changed to: ${peerConnection.connectionState}`)
        switch (peerConnection.connectionState) {
          case "new":
          case "connected":
            console.log('peers connected')
            break;
          case "disconnected":
            console.log('peers disconnected');
            this.closePeerConnectionWithUser(receiver);
            break;
          case "closed":
            console.log('peers closed');
            this.closePeerConnectionWithUser(receiver);
            break;
          case "failed":
            console.log('peers failed');
            break;
          default:
            // setOnlineStatus("Unknown");
            break;
        }
      });

      if (this.user.is_proctor) {
        let remoteStreams = [new MediaStream(), new MediaStream()];
        this.$refs[`remoteVideo_${receiver.id}`].srcObject = remoteStreams[0];
        this.$refs[`remoteDisplayVideo_${receiver.id}`].srcObject = remoteStreams[1];
        peerConnection.addEventListener('track', async (event) => {
          console.log('got track')
          remoteStreams[0].addTrack(event.track, remoteStreams[0]);
          remoteStreams = [
            remoteStreams[1],
            remoteStreams[0],
          ]
          console.log(event.streams)
        });
        // peerConnection.onaddstream = e => {
        //   this.$refs[`remoteVideo_${receiver.id}`].srcObject = e.stream;
        //   this.$refs[`remoteVideo_${receiver.id}`].play();
        //   console.log("Received remote stream");
        // };
        // peerConnection.createDataChannel("dummy");
      } else {
        // let remoteStream = new MediaStream();
        // this.$refs[`remoteProctor`].srcObject = remoteStream;
        // peerConnection.addEventListener('track', async (event) => {
        //   console.log('got track')
        //   remoteStream.addTrack(event.track, remoteStream);
        //   console.log(event.streams);
        // });
      }
      this.peers[receiver.id] = peerConnection;
      console.log("Added localStream to localPeerConnection");
      return peerConnection
    },

    async createUserPeerConnection(receiver) {
      let peerConnection = this.createProctorPeerConnection(receiver);
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
      this.localDisplayStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localDisplayStream);
      });
      this.peers[receiver.id] = peerConnection;
      console.log("created UserPeerConnection");
    },

    async sendOffer(receiver) {
      let peerConnection = this.peers[receiver.id];
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      this.channel.push("offerRTC", {
        body: {
          "offer": offer,
          receiver: receiver,
          from: this.user
        }
      });
    },

    async receiveAnswer(body) {
      let peer = body.from
      if (this.peers[peer.id]) {
        let pc = this.peers[peer.id];
        const remoteDesc = new RTCSessionDescription(body.answer);
        await pc.setRemoteDescription(remoteDesc);
        console.log('got answer')
      }
    },

    async receiveOffer(body) {
      let peer = body.from
      if (this.user.is_proctor) {
        this.createProctorPeerConnection(peer);
      } else {
        await this.createUserPeerConnection(peer);
      }
      if (this.peers[peer.id]) {
        // console.log('got offer', body);
        let pc = this.peers[peer.id];
        await pc.setRemoteDescription(new RTCSessionDescription(body.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.channel.push("answerRTC", {
          body: {
            "answer": answer,
            receiver: peer,
            from: this.user
          }
        });
      }
    },

    async receiveIceCandidate(body) {
      let peer = body.from
      if (this.peers[peer.id]) {
        let pc = this.peers[peer.id];
        console.log('Got ICE Candidate')
        try {
          await pc.addIceCandidate(body.iceCandidate);
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    },

    async refresh() {
      try {
        let res = await ajax.get(`users/room/${this.user.is_admin ? this.roomId : this.user.room}`);
        this.room.users_in_room = res.data.data;
      } catch (e) {
        this.$toast.add({severity: 'error', summary: 'Не удалось загрузить пользователей', life: 3000});
      }
    },

    async init() {
      if (!this.loggedIn) {
        await this.$router.push("/login");
        return;
      }
      await this.refresh();
      this.joined = true;
      if (!this.user.is_proctor) {

        this.localStream = await openMediaDevices({'video': true, 'audio': false});
        this.localDisplayStream = await openDisplayDevices({'video': true, 'audio': false})
        this.$refs["localVideo"].srcObject = this.localStream;
        this.$refs["localDisplayVideo"].srcObject = this.localDisplayStream;
      } else {
        // this.localStream = await openMediaDevices({'video': true, 'audio': true});
      }
      this.socket = new Socket(`${websocket_url}`, {params: {token: this.token}})
      this.socket.connect()
      this.channel = this.socket.channel(`proctor:${this.user.is_admin ? this.roomId : this.user.room}`, {})
      this.channel.join()
          .receive("ok", resp => {
            console.log("Joined successfully", resp)
          })
          .receive("error", resp => {
            console.log("Unable to join", resp)
          })

      this.channel.on("proctor_joined", async payload => {
        console.log("proctor_joined", payload.body.user)
        this.room.proctors[payload.body.user.id] = payload.body.user;
        if (this.user.is_proctor) {
          this.channel.push("proctor_here", {
            body: {
              "user": this.user,
            }
          });
        } else {
          this.channel.push("user_here", {
            body: {
              "user": this.user,
            }
          });
          if (this.peers[payload.body.user.id]) {
            await this.closePeerConnectionWithUser(payload.body.user);
          }
          await this.createUserPeerConnection(payload.body.user)
          await this.sendOffer(payload.body.user);
        }
      });

      this.channel.on("offerRTC", async payload => {
        console.log("got offer", payload.body)
        await this.receiveOffer(payload.body)
      });

      this.channel.on("answerRTC", async payload => {
        console.log("got answer", payload.body)
        await this.receiveAnswer(payload.body)
      });

      this.channel.on("iceCandidate", async payload => {
        console.log("got iceCandidate", payload.body)
        await this.receiveIceCandidate(payload.body)
      });

      this.channel.on("user_joined", async payload => {
        if (this.user.is_proctor) {
          this.channel.push("proctor_here", {
            body: {
              "user": this.user,
            }
          });
          // if (this.peers[payload.body.user.id]) {
          //   await this.closePeerConnectionWithUser(payload.body.user);
          // }
          // await this.createProctorPeerConnection(payload.body.user);
          // await this.sendOffer(payload.body.user);
        } else {
          this.channel.push("user_here", {
            body: {
              "user": this.user,
            }
          });
        }
        this.room.users[payload.body.user.id] = payload.body.user;
      });

      this.channel.on("user_left", async payload => {
        console.log("user left", payload)
        delete this.room.proctors[payload.body.user.id];
        if (this.peers[payload.body.user.id]) {
          await this.closePeerConnectionWithUser(payload.body.user);
        }
        delete this.room.users[payload.body.user.id];
      });

      this.channel.on("proctor_here", async payload => {
        this.room.proctors[payload.body.user.id] = payload.body.user;
        if (!this.user.is_proctor) {
          if (!this.peers[payload.body.user.id]) {
            await this.createUserPeerConnection(payload.body.user)
            await this.sendOffer(payload.body.user);
          }
        }
      });
      this.channel.on("user_here", async payload => {
        this.room.users[payload.body.user.id] = payload.body.user;
      });

      if (this.user.is_proctor) {
        this.channel.push("proctor_joined", {
          body: {
            "user": this.user,
          }
        })
      } else {
        this.channel.push("user_joined", {
          body: {
            "user": this.user,
          }
        })
      }
    }
  },
  mounted() {
  },
  unmounted() {
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.stream) {
      this.stream.close();
    }
  }
}
</script>

<style scoped>

</style>