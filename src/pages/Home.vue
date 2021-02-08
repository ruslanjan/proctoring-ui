<template>
  <div class="p-justify-center p-align-center p-d-flex" style="flex-grow: 1">
    <Button class="p-button-lg" v-if="loggedIn" @click="$router.push({name: 'Proctoring'})">Initialize connection
    </Button>
<!--    <Button @click="check" label="22"></Button>-->
  </div>
</template>

<script>

export default {
  name: "Home",
  computed: {
    loggedIn() {
      return this.$store.getters['loggedIn']
    },
  },
  methods: {
    checkTURNServer(turnConfig, timeout) {
      return new Promise(function (resolve) {

        setTimeout(function () {
          if (promiseResolved) return;
          resolve(false);
          promiseResolved = true;
        }, timeout || 5000);

        var promiseResolved = false
            ,
            myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection   //compatibility for firefox and chrome
            , pc = new myPeerConnection({iceServers: [turnConfig]})
            , noop = function () {
            };
        pc.createDataChannel("");    //create a bogus data channel
        pc.createOffer(function (sdp) {
          if (sdp.sdp.indexOf('typ relay') > -1) { // sometimes sdp contains the ice candidates...
            promiseResolved = true;
            resolve(true);
          }
          pc.setLocalDescription(sdp, noop, noop);
        }, noop);    // create offer and set local description
        pc.onicecandidate = function (ice) {  //listen for candidate events
          if (promiseResolved || !ice || !ice.candidate || !ice.candidate.candidate || !(ice.candidate.candidate.indexOf('typ relay') > -1)) return;
          promiseResolved = true;
          resolve(true);
        };
      });
    },
    check() {
      this.checkTURNServer({
        urls: 'turn:turn.proctor.iitu.kz',
        username: 'proctoring',
        credential: 'proctoring'
      }).then(function(bool){
        console.log('is TURN server active? ', bool? 'yes':'no');
      }).catch(console.error.bind(console));
    }
  },
  mounted() {
    if (!this.loggedIn) {
      this.$router.push("/login");
    }
  }
}
</script>

<style scoped>

</style>