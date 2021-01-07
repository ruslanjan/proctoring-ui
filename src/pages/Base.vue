<template>
  <Toast/>
  <div style="min-height: 100vh; display: flex; flex-direction: column">
    <Menubar :model="items">
      <template #start>
        <Button class="p-button-link" @click="$router.push({'name': 'Home'})">ProcTV</Button>
      </template>
      <template #end>
        <div class="p-d-flex p-align-center" style="gap: 0.75rem">
          <div v-if="auth.loggedIn">
            {{ auth.user.name }}
          </div>
          <Button v-if="auth.loggedIn" class="p-button-danger p-button-sm" @click="tryLogout">
            Logout
          </Button>
        </div>
        <Button v-if="!auth.loggedIn" class="p-button-info p-button-sm" @click="$router.push({'name': 'Login'})">Login
        </Button>
      </template>
    </Menubar>
    <router-view></router-view>
    <div class="p-d-flex" style="justify-content: center; padding: 20px">
      <div style="text-align: center">
        Made by <strong>Ruslan Jankurazov 2021</strong><br/>
        ruslanjan888@gmail.com
        <br/>
        <a href="https://github.com/ruslanjan/">github</a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "Base",
  computed: {
    auth() {
      return this.$store.getters['auth']
    },
  },
  methods: {
    ...mapActions([
      'logout'
    ]),
    tryLogout() {
      this.$router.push('/login');
      this.logout();
    }
  },
  data() {
    return {
      items: [
        {
          label: 'Users',
          icon: 'pi pi-fw pi-user',
          visible: () => {
            return this.auth.loggedIn && this.auth.user.is_admin
          },
          items: [
            {
              label: 'Новый',
              icon: 'pi pi-fw pi-user-plus',
              command: () => {
                this.$router.push({name: 'NewUser'});
              }
            },
            {
              label: 'Список',
              icon: 'pi pi-fw pi-user-minus',
              command: () => {
                this.$router.push({name: 'ListUsers'});
              }
            }
          ]
        }
      ]
    }
  },

}
</script>

<style scoped>

</style>