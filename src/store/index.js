import Vue from 'vue'
import Vuex from 'vuex'

import { defaultProgress, defaultFilters } from '../data/defaults'
import defaultWeapons from '../data/weapons'
import camouflages from '../data/camouflages'

Vue.use(Vuex)

// The localStorage token
const token = process.env.NODE_ENV === 'production' ? 'vanguard' : 'vanguard-dev';

export default new Vuex.Store({
  state: {
    weapons: [],

    camouflages: [ ...camouflages ],

    filters: { ...defaultFilters }
  },

  mutations: {
    SET_PROGRESS(state, weapons) {
      state.weapons = defaultWeapons;

      if (weapons) {
        weapons.forEach(weapon => {
          state.weapons.find(w => w.name === weapon.name).progress = {
            aether: { ...defaultProgress, ...weapon.progress.aether },
            atomic: { ...defaultProgress, ...weapon.progress.atomic }
          }
        });
      }
    },

    SET_FILTERS(state, { type, filters }) {
      if (type === null) {
        // Handle updates to default filter object
        if (filters) {
          Object.keys(defaultFilters).forEach(key => {
            if (!(key in filters)) {
              filters = null;
            }
          });
        }

        state.filters = filters || defaultFilters;
      } else {
        state.filters[type] = filters || defaultFilters[type];
      }
    },

    TOGGLE_COMPLETED(state, { mode, weapon, camo, current }) {
      state.weapons.find(w => w.name === weapon.name).progress[mode][camo] = !current;
    },

    TOGGLE_WEAPON_COMPLETED(state, { mode, weapon, current }) {
      let selectedWeapon = state.weapons.find(w => w.name === weapon.name);

      Object.keys(selectedWeapon.progress[mode]).forEach(camo => selectedWeapon.progress[mode][camo] = !current);
    },

    RESET_PROGRESS(state, type) {
      state.weapons.forEach(weapon => Object.keys(weapon.progress[type]).forEach(camo => weapon.progress[type][camo] = false));
    },

    // DEBUG
    COMPLETE_ATOMIC(state) {
      state.weapons.forEach(weapon => Object.keys(weapon.progress.atomic)
                   .forEach(camo => weapon.progress.atomic[camo] = true));
    },
    COMPLETE_AETHER(state) {
      state.weapons.forEach(weapon => Object.keys(weapon.progress.aether)
                   .forEach(camo => weapon.progress.aether[camo] = true));
    },
    COMPLETE_ALL_BUT_ONE(state) {
      state.weapons.forEach((weapon, weaponIndex) => Object.keys(weapon.progress)
                   .forEach(type => Object.keys(type)
                   .forEach((camo, camoIndex) => {
                     if (!(weaponIndex === 0 && camoIndex === 0)) {
                      weapon.progress[camo] = true;
                     }
                   })));
    }
  },

  actions: {
    async getStoredData({ dispatch }) {
      await dispatch('getProgress');
      await dispatch('getFilters');

      await dispatch('storeData');
    },

    getProgress(context) {
      const data = JSON.parse(localStorage.getItem(token));
      const weapons = data ? data.weapons : null;
      context.commit('SET_PROGRESS', weapons);
    },

    getFilters(context) {
      const data = JSON.parse(localStorage.getItem(token));
      const filters = data ? data.filters : null;
      context.commit('SET_FILTERS', { type: null, filters });
    },

    setFilters(context, filters) {
      context.commit('SET_FILTERS', filters);
      context.dispatch('storeData');
    },

    toggleCompleted(context, { mode, weapon, camo, current }) {
      context.commit('TOGGLE_COMPLETED', { mode, weapon, camo, current });
      context.dispatch('storeData');
    },

    toggleWeaponCompleted(context, { mode, weapon, current }) {
      context.commit('TOGGLE_WEAPON_COMPLETED', { mode, weapon, current });
      context.dispatch('storeData');
    },

    resetAll(context) {
      context.commit('RESET_PROGRESS', 'aether');
      context.commit('RESET_PROGRESS', 'atomic');
      context.dispatch('storeData');

      Vue.notify({
        type: 'success',
        title: 'All progress successfully reset!'
      });
    },

    resetProgress(context, type) {
      context.commit('RESET_PROGRESS', type);
      context.dispatch('storeData');

      Vue.notify({
        type: 'success',
        title: `${ type === 'atomic' ? 'Atomic' : 'Dark Aether' } progress successfully reset!`
      });
    },

    clearLocalStorage(context) {
      localStorage.removeItem(token);

      setTimeout(() => {
        context.dispatch('resetProgress');
      }, 500);
    },

    exportProgress() {
      const dataStr = JSON.stringify(this.state.weapons);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const fileName = `${token}_${ new Date().toLocaleDateString('sv-SE').replace(/\//g, '-') }.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();
    },

    importProgress(context, progress) {
      context.commit('SET_PROGRESS', progress);
      context.dispatch('storeData');
    },

    storeData() {
      localStorage.setItem(token, JSON.stringify({
        weapons: this.state.weapons,
        filters: this.state.filters
      }));
    },

    // DEBUG
    completeAtomic(context) {
      context.commit('COMPLETE_ATOMIC');
      context.dispatch('storeData');
    },
    completeAether(context) {
      context.commit('COMPLETE_AETHER');
      context.dispatch('storeData');
    },
    completeAll(context) {
      context.commit('COMPLETE_ATOMIC');
      context.commit('COMPLETE_AETHER');
      context.dispatch('storeData');
    },
    completeAllButOne(context) {
      context.commit('COMPLETE_ALL_BUT_ONE');
      context.dispatch('storeData');
    },
  },
})
