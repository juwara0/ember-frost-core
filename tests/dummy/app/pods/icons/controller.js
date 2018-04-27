import Controller from '@ember/controller';
import iconPack from 'modules/ember-frost-core/icons'

export default Controller.extend({
  backgroundColors: [
    'bg-tile-color',
    'bg-content-color',
    'bg-info-color',
    'bg-hint-text-color',
    'bg-line-color',
    'bg-main-button-color'
  ],
  backgroundColor: 'bg-tile-color',

  init () {
    this.set(
      'icons',
      iconPack.map((icon) => {
        return {
          name: icon,
          markdown: `\`${icon}\``
        }
      })
    )
  },

  actions: {
    colorSelected (color) {
      this.set('backgroundColor', color)
    }
  }
})
