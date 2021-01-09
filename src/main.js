import 'es6-promise/auto';
import { createApp } from 'vue'
import App from './App.vue'
import router from "@/router";
import store from "@/store";
import Dialog from 'primevue/dialog';
import Button from "primevue/button";
import MegaMenu from "primevue/megamenu";
import ToastService from 'primevue/toastservice';
import 'normalize.css/normalize.css';
import 'primevue/resources/primevue.min.css';
import 'primevue/resources/themes/saga-green/theme.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import Menubar from "primevue/menubar";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Toast from "primevue/toast";
import Checkbox from "primevue/checkbox";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import InlineMessage from 'primevue/inlinemessage';
import InputNumber from 'primevue/inputnumber';
import FileUpload from 'primevue/fileupload';


const app = createApp(App);

app.config.devtools = true;

app.use(store)
app.use(router)
app.use(ToastService);

const primeComponents = {
  Dialog,
  Button,
  MegaMenu,
  Menubar,
  InputText,
  Card,
  Toast,
  Checkbox,
  DataTable,
  Column,
  Message,
  Textarea,
  InlineMessage,
  InputNumber,
  FileUpload
}
Object.keys(primeComponents).forEach(key => {
  app.component(key, primeComponents[key]);
})

app.config.globalProperties.$primevue = {ripple: true};

app.mount('#app')

export { app }
