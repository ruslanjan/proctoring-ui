const loadState = () => {
  try {
    const serializedState = localStorage.getItem("auth");
    if (!serializedState) return undefined;
    else return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("auth", serializedState);
  } catch (err) {
    console.log(err);
  }
};

const auth = {
  state: () => (loadState() || {
    loggedIn: false,
    user: null,
    token: null
  }),
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setToken(state, token) {
      state.token = token
    },
    setLoggedIn(state, loggedIn) {
      state.loggedIn = loggedIn
    }
  },
  actions: {
    login({commit, state}, {user, token}) {
      commit('setUser', user);
      commit('setToken', token);
      commit('setLoggedIn', true);
      saveState(state);
    },
    logout({commit, state}) {
      commit('setUser', null);
      commit('setToken', null);
      commit('setLoggedIn', false);
      saveState(state);
    }
  },
  getters: {
    token(state) {
      return state.token;
    },
    user(state) {
      return state.user
    },
    loggedIn(state) {
      return state.loggedIn
    },
    auth(state) {
      return state
    }
  }
}

export default auth