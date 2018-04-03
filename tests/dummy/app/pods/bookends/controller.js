import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

// BEGIN-SNIPPET bookends-controller
export default Controller.extend({
  notifications: service('notification-messages'),

  actions: {
    showNotification (message) {
      this.get('notifications').success(message, {
        autoClear: true,
        clearDuration: 2000
      })
    }
  }
})
// END-SNIPPET
