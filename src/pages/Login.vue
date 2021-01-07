<template>
  <div style="flex-grow: 1; display: flex; justify-content: center; align-items: center">
    <Card>
      <template #title>
        Login
      </template>
      <template #content>
        <div style="display: flex; flex-direction: column; gap: 8px">
          <InputText name="username" :disabled="loading" type="text" v-model="username" placeholder="Username"/>
          <InputText name="password" :disabled="loading" type="password" v-model="password" placeholder="Password"/>
        </div>
      </template>
      <template #footer>
        <Button :disabled="loading" @click="tryLogin" icon="pi pi-sign-in" label="Login" style="width: 100%"/>
      </template>
    </Card>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import ajax from "@/api/ajax";

export default {
  name: "Login",
  data: () => ({
    username: '',
    password: '',
    loading: false,
  }),
  computed: {
  },
  methods: {
    ...mapActions(
        ['login']
    ),
    async tryLogin() {
      this.loading = true;
      try {
        let res = await ajax.post('login', {
          'username': this.username,
          'password': this.password,
        })
        if (res.status === 200) {
          this.$toast.add({severity:'success', summary: 'Вы вошли', life: 3000});
        }
        this.login(res.data);
        this.$router.push('/');
      } catch (e) {
        if (e.response.status === 422) {
          this.$toast.add({severity:'error', summary: 'Не верные учетные данные', life: 3000});
        }
        console.log(e);
      }
      this.loading = false;
    }
  },
}
</script>

<style scoped>

</style>