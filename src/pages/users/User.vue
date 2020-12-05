<template>
  <div style="padding: 0.72rem">
    <Card v-if="!!user">
      <template #title>
        Пользователь #{{ userId }}
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
        <div class="p-d-flex" style="gap: .5em">
          <Button icon="pi pi-check" label="Изменить"
                  @click="save"/>
          <Button icon="pi pi-times" label="Отмена" class="p-button-secondary"
                  @click="$router.back()"/>
          <div style="flex-grow: 1"></div>
          <Button icon="pi pi-trash" label="Удалить" class="p-button-danger"
                  @click="deleteUser"/>
        </div>
      </template>
    </Card>
  </div>
</template>

<script>
import ajax from "@/api/ajax";

export default {
  name: "User",
  props: ['userId'],
  data() {
    return {
      user: {},
      new_password: '',
      errors: {},
    }
  },
  methods: {
    async deleteUser() {
      try {
        let res = await ajax.delete(`users/${this.userId}`);
        if (res.status === 204) {
          this.$toast.add({severity: 'success', summary: 'Пользователь удален', life: 3000});
          this.$router.push({name: "ListUsers"});
        }
      } catch (e) {
        this.$toast.add({severity: 'error', summary: 'Не удалось удалить пользователя', life: 3000});
      }
    },
    async save() {
      try {
        let data = {
          user: this.user
        };
        if (this.new_password) {
          data.user.password = this.new_password;
        }
        let res = await ajax.put(`users/${this.userId}`, data);
        if (res.status === 200) {
          this.user = res.data.data;
          this.errors = {};
          this.$toast.add({severity: 'success', summary: 'Пользователь сохранен', life: 3000});
        }
      } catch (e) {
        if (e.response.status === 422) {
          this.errors = e.response.data.errors;
        }
        this.$toast.add({severity: 'error', summary: 'Не удалось сохранить пользователя', life: 3000});
      }
    }
  },
  computed: {},
  async mounted() {
    try {
      let res = await ajax.get(`users/${this.userId}`);
      if (res.status === 200) {
        this.user = res.data.data
      }
    } catch (e) {

      this.$toast.add({severity: 'error', summary: 'Такого пользователя нет', life: 3000});
    }
  }
}
</script>

<style scoped>

</style>