<template>
  <div style="padding: 1rem">
    <DataTable :value="users">
      <Column field="id" header="Id"></Column>
      <Column field="username" header="Пользователь"></Column>
      <Column field="name" header="Имя"></Column>
      <Column field="room" header="Комната"></Column>
      <Column field="is_proctor" header="Проктор"></Column>
      <Column field="is_admin" header="Админ"></Column>
      <Column>
        <template #body="slotProps">
          <Button type="button" icon="pi pi-pencil" @click="$router.push({name: 'User', params: {userId: slotProps.data.id}})"></Button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script>
import ajax from "@/api/ajax";

export default {
  name: "ListUsers",
  data() {
    return {
      users: []
    }
  },
  methods: {
    async reloadUsers() {
      try {
        let res = await ajax.get('users');
        if (res.status === 200) {
          this.users = res.data.data
        }
      } catch (e) {
        console.log(e);
      }
    }
  },
  mounted() {
    this.reloadUsers();
  }
}
</script>

<style scoped>

</style>