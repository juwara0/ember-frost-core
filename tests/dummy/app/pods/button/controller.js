import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  notifications: service('notification-messages'),
  vertical: false,

  actions: {
    onClickHandler () {
      this.get('notifications').success('Button clicked action sent', {
        autoClear: true,
        clearDuration: 2000
      })
    },

    onFocusHandler () {
      this.get('notifications').success('Button focused action sent', {
        autoClear: true,
        clearDuration: 2000
      })
    },

    /**
     * Toggle vertical rendering
     */
    toggleVertical () {
      this.toggleProperty('vertical')
    }
  }
})
