<template>
  <div v-if="!joined && !!user" class="p-justify-center p-align-center p-d-flex" style="flex-grow: 1; gap: 0.75em">
    <form @submit.prevent="init" class="p-d-flex" style="gap: 0.75em" v-if="loggedIn">
      <Button class="p-button-lg" v-if="loggedIn" :disabled="connect_disabled" @click="init">Connect</Button>
      <div v-if="user.is_admin || user.is_proctor">
          <span class="p-float-label">
            <InputText id="room" v-model.number="roomId" autofocus/>
            <label for="room">Room</label>
          </span>
      </div>
    </form>
  </div>
  <Message v-if="allowWebcam" severity="error">
    <h3 style="margin: 0">Allow Webcam and microphone access</h3>
    <ul style="margin: 0">
      <li><a href="https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DDesktop">for chrome users</a>
      </li>
      <li><a href="https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions">for firefox
        users</a></li>
    </ul>
  </Message>
  <Message v-if="allowDisplay" severity="error">
    <h3 style="margin: 0">Allow Screen access</h3>
  </Message>
  <div v-if="!!user && joined" class="p-m-4">
    <Button @click="playNotification" label="Check notification sound"/>
    <div>
      <h2>Room #{{ user.is_admin || user.is_proctor ? roomId : user.room }}</h2>
      <h2>Proctors:</h2>
      <div class="p-d-flex p-px-4 p-pb-3" style="gap: 0.75em; flex-wrap: wrap">
        <div v-for="user in room.users_in_room.filter((user) => user.is_proctor)" :key="user.id">
          <span
              :class="`p-tag ${room.proctors[user.id] || !current_user.is_proctor?'p-tag-danger-info':'p-tag-danger'}`">{{
              user.name
            }}</span>
        </div>
      </div>
    </div>
    <div v-if="user.is_proctor">
      <h2>Users online</h2>
      <div class="p-d-flex p-px-4 p-pb-3" style="gap: 0.75em; flex-wrap: wrap">
        <div v-for="user in room.users_in_room.filter((user) => !user.is_proctor)" :key="user.id">
          <span :class="`p-tag ${room.users[user.id]?'':'p-tag-danger'}`">{{ user.name }}</span>
        </div>
      </div>
    </div>
    <div v-if="user.is_admin || user.is_proctor">
      <Card>
        <template #title>
          System Chat
        </template>
        <template #content>
          <div class="messages-container">
            <div class="messages-scroller" ref="systemChat">
              <template v-for="message in chat.system" :key="message.id">
                <div>
                  <div class="p-inline-message p-component" v-if="!message.is_system">
                    <div class="p-inline-message-icon pi pi-user"></div>
                    <!--            pi-exclamation-triangle-->
                    <div class="p-inline-message-text">
                      <div class="message">
                        <div style="flex-grow: 1">
                          <div>
                            <strong>System</strong>
                          </div>
                          <div>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur error
                            repudiandae
                            numquam deserunt
                            quisquam repellat libero asperiores earum nam nobis, culpa ratione quam perferendis esse,
                            cupiditate
                            neque
                            quas!
                          </div>
                        </div>
                        <div>
                          19:00
                        </div>
                      </div>
                    </div>
                  </div>
                  <InlineMessage severity="warn" v-if="message.is_system">
                    <div class="message">
                      <div style="flex-grow: 1">
                        <div>
                          <strong>{{ message.from }}</strong>
                        </div>
                        <div v-if="message.has_image">
                          <img style="max-width: 100%" :src="`${api_url}/chat/messages/get-image/${message.id}.${message.image_extension}`">
                        </div>
                        <div style="white-space: normal; word-break: break-all">
                          <pre>{{ message.message }}</pre>
                        </div>
                      </div>
                      <div style="padding-left: 1em; white-space: nowrap">
                        {{ fromNow(message.inserted_at) }}
                      </div>
                    </div>
                  </InlineMessage>
                </div>
              </template>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="p-d-flex" style="gap: 1.5em">
            <Textarea style="flex-grow: 1" type="text"
                      @keydown.enter.shift.exact="sendToUser(user)"
                      v-model="systemMessageDraft" placeholder="Talk to the hand"/>
            <FileUpload :customUpload="true" :disabled="loading" @uploader="sendSystemMessage" accept="image/*"/>
            <Button icon="pi pi-upload" :disabled="loading" label="Send" @click="sendSystemMessage"/>
          </div>
        </template>
      </Card>
    </div>
    <div v-else>
      <Card>
        <template #title>
          Chat
          <!--      User Side chat-->
        </template>
        <template #content>
          <div class="messages-container">
            <div class="messages-scroller" ref="userChat">
              <template v-for="message in chat.user" :key="message.id">
                <div>
                  <div class="p-inline-message p-component" v-if="!message.is_system">
                    <div class="p-inline-message-icon pi pi-user"></div>
                    <!--            pi-exclamation-triangle-->
                    <div class="p-inline-message-text">
                      <div class="message">
                        <div style="flex-grow: 1">
                          <div>
                            <strong>{{ message.from }}</strong>
                          </div>
                          <div v-if="message.has_image">
                            <img style="max-width: 100%" :src="`${api_url}/chat/messages/get-image/${message.id}.${message.image_extension}`">
                          </div>
                          <div style="white-space: normal; word-break: break-all">
                            <pre>{{ message.message }}</pre>
                          </div>
                        </div>
                        <div style="padding-left: 1em; white-space: nowrap">
                          {{ fromNow(message.inserted_at) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <InlineMessage severity="warn" v-else>
                    <div class="message">
                      <div style="flex-grow: 1">
                        <div>
                          <strong>{{ message.from }}</strong>
                        </div>
                        <div v-if="message.has_image">
                          <img style="max-width: 100%" :src="`${api_url}/chat/messages/get-image/${message.id}.${message.image_extension}`">
                        </div>
                        <div style="white-space: normal; word-break: break-all">
                          <pre>{{ message.message }}</pre>
                        </div>
                      </div>
                      <div style="padding-left: 1em; white-space: nowrap">
                        {{ fromNow(message.inserted_at) }}
                      </div>
                    </div>
                  </InlineMessage>
                </div>
              </template>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="p-d-flex" style="gap: 1.5em">
            <Textarea style="flex-grow: 1" type="text"
                      @keydown.enter.shift.exact="sendToUser(user)"
                      v-model="userMessageDraft" placeholder="Talk to the hand"/>
            <FileUpload :customUpload="true" :disabled="loading" @uploader="sendUserMessage" accept="image/*"/>
            <Button icon="pi pi-upload" :disabled="loading" label="Send" @click="sendUserMessage"/>
          </div>
        </template>
      </Card>
    </div>

    <video height="260" ref="localVideo" v-if="!user.is_proctor" muted autoplay></video>
    <video height="260" ref="localDisplayVideo" v-if="!user.is_proctor" muted autoplay></video>
    <video height="260" ref="remoteProctor" v-if="!user.is_proctor" autoplay></video>
    <!--    <audio ref="remoteAudio" autoplay v-if="!user.is_proctor"></audio>-->

    <audio ref="notifyAudio">
      <source src="/piece-of-cake-611.mp3" type="audio/mpeg">
    </audio>
    <div v-if="user.is_proctor" class="p-mt-3">
      <div class="p-d-flex" style="justify-content: space-between">
        <h2>Users streams:</h2>
      </div>
      <div style="position: fixed; bottom: 0; right: 0">
        <span class="p-float-label" style="margin: 16px">
        <InputNumber id="columns" buttonLayout="horizontal" showButtons
                     v-model="columns"/>
        <label for="columns">Columns</label>
        </span>
      </div>
      <div style="position: fixed; bottom: 0; left: 0">
        <Button label="Disable all streams"/>
        <Button label="Enable all streams"/>
      </div>
      <div class="users-streams" :style="`grid-template-columns: repeat(${columns}, 1fr);`">
        <Card v-for="user in room.users" :key="user.id">
          <template #header>
            <div>
              <video class="proctor-user-stream" :ref="`remoteVideo_${user.id}`" playsinline autoplay></video>
            </div>
            <div>
              <video class="proctor-user-stream" :ref="`remoteDisplayVideo_${user.id}`" playsinline autoplay></video>
            </div>
            <audio hidden :ref="`remoteAudio_${user.id}`" autoplay></audio>
          </template>
          <template #title>
            <div>
              {{ user.name }}
            </div>
            <div>
              <Button style="float: right; margin-left: 10px" @click="muteUser(user)" :disabled="user.muted"
                      label="Mute"></Button>
              <Button style="float: right" @click="unmuteUser(user)" :disabled="!user.muted" label="Unmute"></Button>
            </div>
            <Card>
              <template #title>
                Chat
                <!--      User Side chat-->
              </template>
              <template #content>
                <div class="messages-container">
                  <div class="messages-scroller" :ref="`userChat_${user.id}`"
                       :style="room.users[user.id].unanswered?'background-color: orangered':''">
                    <template v-for="message in user.chat" :key="message.id">
                      <div>
                        <div class="p-inline-message p-component" v-if="!message.is_system">
                          <div class="p-inline-message-icon pi pi-user"></div>
                          <!--            pi-exclamation-triangle-->
                          <div class="p-inline-message-text">
                            <div class="message">
                              <div style="flex-grow: 1">
                                <div>
                                  <strong>{{ message.from }}</strong>
                                </div>
                                <div v-if="message.has_image">
                                  <img style="max-width: 100%" :src="`${api_url}/chat/messages/get-image/${message.id}.${message.image_extension}`">
                                </div>
                                <div style="white-space: normal; word-break: break-all">
                                  <pre>{{ message.message }}</pre>
                                </div>
                              </div>
                              <div style="padding-left: 1em; white-space: nowrap">
                                {{ fromNow(message.inserted_at) }}
                              </div>
                            </div>
                          </div>
                        </div>
                        <InlineMessage severity="warn" v-else>
                          <div class="message">
                            <div style="flex-grow: 1">
                              <div>
                                <strong>{{ message.from }}</strong>
                              </div>
                              <div v-if="message.has_image">
                                <img style="max-width: 100%" :src="`${api_url}/chat/messages/get-image/${message.id}.${message.image_extension}`">
                              </div>
                              <div style="white-space: normal; word-break: break-all">
                                <pre>{{ message.message }}</pre>
                              </div>
                            </div>
                            <div style="padding-left: 1em; white-space: nowrap">
                              {{ fromNow(message.inserted_at) }}
                            </div>
                          </div>
                        </InlineMessage>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
              <template #footer>
                <div class="p-d-flex" style="gap: 1.5em">
                  <Textarea style="flex-grow: 1" type="text" v-model="sendToUserDraft[user.id]"
                            @keydown.enter.shift.exact="sendToUser(user, $event)"
                            placeholder="Talk to the hand"/>
                  <FileUpload :customUpload="true" :disabled="loading" @uploader="sendToUser(user, $event)" accept="image/*"/>
                  <Button icon="pi pi-upload" label="Send" :disabled="loading" @click="sendToUser(user, $event)"/>
                </div>
              </template>
            </Card>
          </template>
          <template #content>

          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>

.messages-container {
  border: gray 2px solid;
  border-radius: 10px;
  height: 512px;
}

.messages-scroller {
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  padding: 10px;
  height: 100%;
  overflow-y: scroll;
}

.message {
  display: flex;
  /*grid-template-columns: auto auto;*/
}

.users-streams {
  gap: 0.75rem;
  display: grid;
  /*grid-template-columns: repeat(3, 1fr);*/
}

.proctor-user-stream {
  height: auto;
  width: 100%;
  object-fit: fill;
}

@media only screen and (max-width: 768px) {
  .users-streams {
    display: flex;
    flex-wrap: wrap;
  }
}

pre {
  margin-top: 4px;
  margin-bottom: 4px;
  word-break: break-all;
  white-space: normal;
}
</style>

<script>
import { Socket } from "phoenix"
import ajax, { api_url, websocket_url } from "@/api/ajax";
import moment from 'moment';

const openMediaDevices = async (constraints) => {
  return await navigator.mediaDevices.getUserMedia(constraints);
}
const openDisplayDevices = async (constraints) => {
  return await navigator.mediaDevices.getDisplayMedia(constraints);
}

const servers = {
  "iceServers": [
    {
      url: 'turn:proctor.iitu.kz:3478',
      credential: 'somepassword',
      username: 'guest',
    }, {
      url: 'stun:proctor.iitu.kz:3478',
    },
    {
      urls: 'turn:proctor.iitu.kz:3478',
      credential: 'somepassword',
      username: 'guest',
    }, {
      urls: 'stun:proctor.iitu.kz:3478',
    },


      //TODO Remove
    {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      url: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    },
    {
      url: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }
    // {'urls': 'stun:stun.l.google.com:19302'}
  ],
  iceTransportPolicy: 'all'
};

export default {
  name: "Proctoring",
  computed: {
    api_url() {
      return api_url
    },
    loggedIn() {
      return this.$store.getters['loggedIn']
    },
    user() {
      return this.$store.getters['user']
    },

    current_user() {
      return this.$store.getters['user']
    },
    token() {
      return this.$store.getters['token']
    },
  },
  data() {
    return {
      connect_disabled: false,
      peers: {},
      roomId: 0,
      systemMessageDraft: '',
      userMessageDraft: '',
      sendToUserDraft: '',
      loading: false,
      room: {
        proctors: {},
        users: {},
        users_in_room: []
      },
      chat: {
        system: [],
        user: []
      },
      localStream: null,
      localAudioStream: null,
      localDisplayStream: null,
      localDisplayAudioStream: null,
      socket: null,
      channel: null,
      joined: false,
      // others
      columns: 3,
      allowWebcam: false,
      allowDisplay: false
    }
  },
  methods: {
    // Only UI
    playNotification() {
      this.$refs['notifyAudio'].play();
    },
    fromNow(date) {
      return moment(date).fromNow();
    },

    muteUser(user) {
      console.log(user)
      this.room.users[user.id].muted = true;
      this.room.users[user.id].tracks[2].enabled = !this.room.users[user.id].tracks[2].enabled;
      console.log(this.room.users[user.id].tracks[2]);
    },

    unmuteUser(user) {
      console.log(user)
      this.room.users[user.id].muted = false;
      this.room.users[user.id].tracks[2].enabled = !this.room.users[user.id].tracks[2].enabled;
      console.log(this.room.users[user.id].tracks[2]);
    },
    // --- Only UI ----

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
        let remoteStreams = [new MediaStream(), new MediaStream(), new MediaStream()]; // third is audio
        this.$refs[`remoteVideo_${receiver.id}`].srcObject = remoteStreams[0];
        this.$refs[`remoteDisplayVideo_${receiver.id}`].srcObject = remoteStreams[1];
        this.$refs[`remoteAudio_${receiver.id}`].srcObject = remoteStreams[2];
        this.room.users[receiver.id].tracks = [null, null, null];
        peerConnection.addEventListener('track', async (event) => {
          console.log('got track', event.track, "streams", event.streams)
          if (event.track.kind === "audio") {
            remoteStreams[2].addTrack(event.track, remoteStreams[2]);
            this.room.users[receiver.id].tracks[2] = event.track
          } else {
            remoteStreams[0].addTrack(event.track, remoteStreams[0]);
            this.room.users[receiver.id].tracks[0] = event.track
            this.room.users[receiver.id].tracks = [this.room.users[receiver.id].tracks[1], this.room.users[receiver.id].tracks[0], this.room.users[receiver.id].tracks[2]];
            remoteStreams = [
              remoteStreams[1],
              remoteStreams[0],
              remoteStreams[2],
            ]
          }
          console.log("user tracks added", this.room.users[receiver.id])
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
      this.localAudioStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localAudioStream);
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
      console.log("send offer", {
        body: {
          "offer": offer,
          receiver: receiver,
          from: this.user
        }
      })
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
        let res = await ajax.get(`users/room/${this.user.is_admin || this.user.is_proctor ? this.roomId : this.user.room}`);
        this.room.users_in_room = res.data.data;
      } catch (e) {
        this.$toast.add({severity: 'error', summary: 'Не удалось загрузить пользователей', life: 3000});
      }
    },

    async getImageFromEvent(event) {
      if (event.files) {
        console.log(event)
        const file = event.files[0];
        const getBytes = file => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsBinaryString(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });

        return {
          bytes: btoa(await getBytes(file)),
          extension: file.name.split('.').pop(),
        }
      }
      return null
    },

    async sendUserMessage(event) {
      this.loading = true;
      try {
        let res = await ajax.post('/chat/messages/proctors', {
          message: this.userMessageDraft,
          image: await this.getImageFromEvent(event)
        })
        console.log(res);
        this.userMessageDraft = '';
      } catch (e) {
        console.log('failed to send user message', e)
      }
      this.loading = false;
    },

    async sendSystemMessage(event) {
      this.loading = true;
      try {
        let res = await ajax.post('/chat/messages/system', {
          message: this.systemMessageDraft,
          image: await this.getImageFromEvent(event),
        })
        console.log(res);
        this.systemMessageDraft = '';
      } catch (e) {
        console.log('failed to send system message', e)
      }
      this.loading = false;
    },

    async sendToUser(user, event) {
      this.loading = true;
      this.room.users[user.id].unanswered = false;
      try {
        let res = await ajax.post(`/chat/messages/to-user/${user.id}`, {
          message: this.sendToUserDraft[user.id],
          image: await this.getImageFromEvent(event)
        })
        console.log(res);
        this.sendToUserDraft[user.id] = '';
      } catch (e) {
        console.log('failed to send message to user', e)
      }
      this.loading = false;
    },

    async reloadChats() {
      if (!this.user.is_proctor) {
        try {
          let res = await ajax.get("/chat/messages/my");
          this.chat.user = res.data.data
        } catch (e) {
          console.log("Unable to load messages", e);
        }
      } else {
        try {
          let res = await ajax.get("/chat/messages/system");
          console.log(res);
          this.chat.system = res.data.data;
        } catch (e) {
          console.log("Unable to load messages", e);
        }
      }
    },

    async init_chat() {
      this.chat = this.socket.channel(`chat`, {});

      this.chat.join()
          .receive("ok", resp => {
            console.log("Joined chat successfully", resp)
          })
          .receive("error", resp => {
            console.log("Unable to join chat", resp)
          })
      await this.reloadChats();

      if (!this.user.is_proctor) {
        this.chat.on("new_message", async message => {
          this.chat.user.push(message);
          this.playNotification();
          setTimeout(() => {
            let container = this.$refs['userChat']
            container.scrollTop = container.scrollHeight;
          }, 200);
        });
      } else {
        this.chat.on("new_message", async (message) => {
          if (message.is_system) {
            this.chat.system.push(message);
            this.playNotification();
            setTimeout(() => {
              let container = this.$refs['systemChat']
              container.scrollTop = container.scrollHeight;
            }, 200);
          } else {
            if (message.to_user && this.room.users[message.to_user.id]) {
              this.room.users[message.to_user.id].chat.push(message);
              this.playNotification();
              if (message.from !== 'Proctor' && message.from !== 'System') {
                this.room.users[message.to_user.id].unanswered = true;
              }
            }
            setTimeout(() => {
              let container = this.$refs[`userChat_${message.to_user.id}`]
              container.scrollTop = container.scrollHeight;
            }, 200);
          }
        })
      }
      setTimeout(() => {
        let container = this.$refs['systemChat']
        container.scrollTop = container.scrollHeight;
      }, 200);
      setTimeout(() => {
        let container = this.$refs['userChat']
        container.scrollTop = container.scrollHeight;
      }, 200);
    },

    async loadUserChat(user_id) {
      let res = await ajax.get(`/chat/messages/to-user/${user_id}`)
      this.room.users[user_id].chat = res.data.data;
      let message = res.data.data[res.data.data.length - 1];
      if (message.from !== 'Proctor' && message.from !== 'System') {
        this.room.users[message.to_user.id].unanswered = true;
      }
      setTimeout(() => {
        let container = this.$refs[`userChat_${user_id}`]
        container.scrollTop = container.scrollHeight;
      }, 200);
    },

    async init() {
      if (this.connect_disabled) {
        return;
      }
      this.connect_disabled = true;
      if (!this.loggedIn) {
        await this.$router.push("/login");
        return;
      }
      this.socket = new Socket(`${websocket_url}`, {params: {token: this.token}})
      this.socket.connect()
      ajax.get('/check-auth')
      await this.refresh();
      this.joined = true;
      if (!this.user.is_proctor) {
        try {
          this.localStream = await openMediaDevices({'video': true, 'audio': false});
          this.localAudioStream = await openMediaDevices({'video': false, 'audio': true});
        } catch (e) {
          console.log(e)
          this.allowWebcam = true;
          this.userMessageDraft = "Warning: User doesn't have or blocked webcam sharing request!!!"
          this.sendUserMessage()
        }
        this.$refs["localVideo"].srcObject = this.localStream;
        try {
          this.localDisplayStream = await openDisplayDevices({
            video: {
              cursor: 'always',
              displaySurface: 'monitor'
            }, 'audio': true
          })
          // this.localDisplayAudioStream = await openDisplayDevices({video: false, 'audio': true})
          const checkIsScreen = () => {
            const videoTrack = this.localDisplayStream.getVideoTracks()[0];
            if (videoTrack.getSettings().displaySurface === "monitor" || videoTrack.label === "Primary Monitor") {
              return;
            }
            const videoSetting = videoTrack.getSettings();
            if (videoSetting && videoSetting.displaySurface === "monitor") {
              return;
            }
            throw "not screen"
          }
          checkIsScreen()
          console.log(this.localDisplayStream.getTracks())
          this.$refs["localDisplayVideo"].srcObject = this.localDisplayStream;
        } catch (e) {
          console.log(e)
          this.allowDisplay = true;
          this.userMessageDraft = "Warning: User doesn't have or blocked screen sharing request!!!"
          this.sendUserMessage()
        }
      } else {
        // this.localStream = await openMediaDevices({'video': true, 'audio': true});
      }

      await this.init_chat();

      this.channel = this.socket.channel(`proctor:${this.user.is_admin || this.user.is_proctor ? this.roomId : this.user.room}`, {})


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
          this.loadUserChat(payload.body.user.id);
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
        console.log("proctor_here", payload)
        this.room.proctors[payload.body.user.id] = payload.body.user;
        if (!this.user.is_proctor) {
          if (!this.peers[payload.body.user.id]) {
            await this.createUserPeerConnection(payload.body.user)
            await this.sendOffer(payload.body.user);
          }
        }
      });
      this.channel.on("user_here", async payload => {
        if (!this.room.users[payload.body.user.id]) {
          this.room.users[payload.body.user.id] = payload.body.user;
          this.loadUserChat(payload.body.user.id);
        }
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
      this.localDisplayStream.close();
      this.localStream.close();
    }
  }
}
</script>