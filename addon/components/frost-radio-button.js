/**
 * Component definition for the frost-radio-button component
 */
import $ from 'jquery';

import layout from '../templates/components/frost-radio-button';
import {cloneEvent} from '../utils'
import Component from './frost-component'
import {computed} from '@ember-decorators/object'
import {PropTypes} from 'ember-prop-types'

export default Component.extend({
  // == Dependencies ==========================================================

  // == Keyword Properties ====================================================

  attributeBindings: [
    'tabindex'
  ],

  classNameBindings: [
    'checked',
    'disabled',
    'required',
    'size'
  ],

  layout,

  // == PropTypes =============================================================

  propTypes: {
    // options
    // Group properties
    groupId: PropTypes.string,
    selectedValue: PropTypes.string,
    receivedHook: PropTypes.string,
    // Radio properties
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string,
    required: PropTypes.bool,
    size: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func

    // state
  },

  getDefaultProps () {
    return {
      // Radio properties
      disabled: false,
      required: false,
      size: 'small'
    }
  },

  // == Computed properties  ===================================================

  @computed('selectedValue', 'value')
  /**
   * Determine checked state
   * TODO: make compued property readOnly
   * @param {String} selectedValue - which radio button in the group is selected
   * @param {String} value - radio button value
   * @returns {Boolean} whether this radio button is checked or not
   */
  get checked () { // eslint-disable-line
    return this.get('selectedValue') === this.get('value')
  },

  @computed('receivedHook')
  /**
   * Determine hook name for radio-button
   * TODO: make computed property readOnly
   * @param {String} receivedHook - hook received from parent
   * @returns {String} the concatenated hook name
   */
  get hook () { // eslint-disable-line
    const radioGroupHook = this.getWithDefault('receivedHook', '')
    return `${radioGroupHook}-button`
  },

  set hook (value) {
    const radioGroupHook = this.getWithDefault('receivedHook', '')
    return `${radioGroupHook}-button`
  },

  @computed('value')
  /**
   * Determine hook qualifiers for radio-button
   * @param {String} value - radio button's value
   * @returns {String} the hook qualifiers
   */
  get hookQualifiers () {
    const value = this.get('value')
    if (value) {
      return {value}
    }
  },

  @computed('disabled')
  /**
   * Determine tabindex value
   * @param {Boolean} disabled - is this button disabled
   * @returns {Number} the tabindex value
   */
  get tabindex () {
    return this.get('disabled') ? -1 : 0
  },

  // == Functions ===============================================================

  _changeTarget (event, target) {
    const e = cloneEvent(event, target)

    const groupdId = this.get('groupId')
    if (groupdId) {
      e.target.id = this.get('groupId')
    }

    return e
  },

  // == Events ===============================================================
  /* eslint-disable complexity */
  keyPress (event) {
    if (event.keyCode === 13 || event.keyCode === 32) {
      if (this.get('disabled') || this.get('checked')) {
        return
      }

      if (this.onChange) {
        this.onChange(this._changeTarget(event, $(event.target).find('input')[0]))
      }
    }
  },
  /* eslint-enable complexity */

  change (event) {
    if (this.onChange) {
      this.onChange(this._changeTarget(event, event.target))
    }
  }
})
