import { createStore } from 'vuex'
import auth from "@/store/auth";

const store = createStore({
    modules: {
        auth: auth
    },
    state () {
        return {
        }
    },
})

export default store