import axios from 'axios';
import store from '@/store';
import router from '@/router';

export const api_host = (process.env.NODE_ENV === 'development')
  ? 'localhost:4000'
  : 'proc.tau.moe';

export const api_url = (process.env.NODE_ENV === 'development')
  ? `http://${api_host}/api`
  : `https://${api_host}/api`

export const websocket_url = (process.env.NODE_ENV === 'development')
  ? `ws://${api_host}/api`
  : `wss://${api_host}/api`

const ajax = axios.create({
  // baseURL: (process.env.APP_BASE_URL !== undefined)
  //     ? process.env.APP_BASE_URL
  //     : 'http://auto.aleyron.com/',
  baseURL: api_url
});

ajax.CancelToken = axios.CancelToken;
ajax.isCancel = axios.isCancel;

/*
 * The interceptor here ensures that we check for the token in local storage every time an ajax request is made
 */
ajax.interceptors.request.use(
  async (config) => {
    let token = store.getters['token']

    if (token) {
      config.headers['Authorization'] = `Bearer ${ token }`;
    }

    if (localStorage.language) {
      config.data = {
        ...config.data,
        locale: localStorage.language
      }
    }

    let recaptchaToken = ""
    // try {
    //   await new Promise((resolve, reject) => {
    //     grecaptcha.ready(() => {
    //       resolve(true);
    //     })
    //   });
    //   recaptchaToken = await grecaptcha.execute('6Lc0y8EZAAAAANSOJ7CR-k0hMSC3ifwsCViqIMFw', {action: 'default'})
    // } catch (e) {
    //   console.log(e)
    // }

    if (recaptchaToken) {
      config.headers['RecaptchaV3-Token'] = recaptchaToken;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

const UNAUTHORIZED = 401;
ajax.interceptors.response.use(
  response => response,
  error => {
    console.log(error.response)
    const {status} = error.response;
    if (status === UNAUTHORIZED) {
      store.dispatch('logout');
      router.push("/login")
    }
    return Promise.reject(error);
  }
)

export default ajax;