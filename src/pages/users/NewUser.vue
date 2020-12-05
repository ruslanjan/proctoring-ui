<template>
  <div style="padding: 0.72rem">
    <Card>
      <template #title>
        Новый Пользователь
      </template>
      <template #content>
        <div class="p-d-flex p-flex-column" style="gap: 2rem">
          <div>
            <span class="p-float-label">
              <InputText id="name" v-model="user.name"/>
              <label for="name">Имя</label>
            </span>
            <small v-if="errors.name" class="p-invalid">{{ errors.name }}</small>
          </div>
          <div>
            <span class="p-float-label">
              <InputText id="room" v-model="user.room"/>
              <label for="room">Комната</label>
            </span>
            <small v-if="errors.room" class="p-invalid">{{ errors.room }}</small>
          </div>
          <div>
            <span class="p-float-label">
              <InputText id="username" v-model="user.username"/>
              <label for="username">Хэндл</label>
            </span>
            <small v-if="errors.username" class="p-invalid">{{ errors.username }}</small>
          </div>
          <div>
            <Checkbox :binary="true" v-model="user.is_admin"/>
            Админ
          </div>
          <div>
            <Checkbox :binary="true" v-model="user.is_proctor"/>
            Проктор
          </div>
          <div>
            <span class="p-float-label">
              <InputText id="password" type="password" v-model="user.password"/>
              <label for="password">Пароль</label>
            </span>
            <small v-if="errors.password" class="p-invalid">{{ errors.password }}</small>
          </div>
        </div>
      </template>
      <template #footer>
        <Button icon="pi pi-check" label="Создать"
                @click="save"/>
        <Button icon="pi pi-times" label="Отмена" class="p-button-secondary" style="margin-left: .5em"
                @click="$router.back()"/>
      </template>
    </Card>
  </div>
</template>

<script>
import ajax from "@/api/ajax";

export default {
  name: "NewUser",
  data() {
    return {
      user: {
        username: '',
        password: '',
        is_proctor: false,
        is_admin: false,
        name: ''
      },
      errors: {}
    }
  },
  methods: {
    async save() {
      try {
        let data = {
          user: this.user
        };
        if (this.new_password) {
          data.user.password = this.new_password;
        }
        let res = await ajax.post(`users`, data);
        if (res.status === 201) {
          this.user = res.data.data
          this.$toast.add({severity: 'success', summary: 'Пользователь сохранен', life: 3000});
          this.errors = {};
          this.$router.push({name: 'User', params: {userId: this.user.id}})
        }
      } catch (e) {
        if (e.response.status === 422) {
          this.errors = e.response.data.errors;
        }
        this.$toast.add({severity: 'error', summary: 'Не удалось сохранить пользователя', life: 3000});
      }
    }
  }
}
</script>

<style scoped>

</style>