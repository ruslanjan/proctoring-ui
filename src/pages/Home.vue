<template>
  <div class="p-justify-center p-align-center p-d-flex" style="flex-grow: 1">
    <Button class="p-button-lg" v-if="loggedIn" @click="$router.push({name: 'Proctoring'})">Войти</Button>
  </div>
</template>

<script>

export default {
  name: "Home",
  computed: {
    loggedIn() {
      return this.$store.getters['loggedIn']
    },
  }
}
</script>

<style scoped>

</style>