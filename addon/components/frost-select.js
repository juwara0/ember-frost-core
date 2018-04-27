/**
 * Component definition for frost-select component
 */
import { htmlSafe } from '@ember/string';

import $ from 'jquery';
import { on } from '@ember/object/evented';
import { run } from '@ember/runloop';
import { typeOf } from '@ember/utils';
import layout from '../templates/components/frost-select';
import keyCodes from '../utils/key-codes'
import Component from './frost-component'
import {computed} from 'ember-decorators/object'
import {task, timeout} from 'ember-concurrency'
import {PropTypes} from 'ember-prop-types'

const {DOWN_ARROW, SPACE, UP_ARROW} = keyCodes

/**
 * Compare two string arrays to determine if they contain the same values
 * NOTE: this method does not care about the order of the items
 * @param {Array<String>} a - first array
 * @param {Array<String>} b second array
 * @returns {Boolean} whether or not arrays contain same values
 */
function compareArrays (a, b) {
  if (a.length !== b.length) {
    return false
  }

  a = a.sort()
  b = b.sort()

  return a.every((value, index) => value === b[index])
}

/**
 * Compare two selected value objects to determine if they are equivalent
 * @param {Array<String>|String} a - first selected value object
 * @param {Array<String>|String} b - second selected value object
 * @returns {Boolean} whether or not selected value objects are equivalent
 */
function compareSelectedValues (a, b) {
  if (typeOf(a) === 'array' && typeOf(b) === 'array') {
    return compareArrays(a, b)
  }

  return a === b
}

export default Component.extend({
  // == Dependencies ==========================================================

  // == Keyword Properties ====================================================

  attributeBindings: [
    'ariaLabel:aria-label',
    'computedTabIndex:tabIndex',
    'opened:aria-pressed',
    'role',
    'style'
  ],

  classNameBindings: [
    'disabled:frost-select-disabled',
    'error:frost-select-error',
    'focused:frost-select-focused',
    'opened:frost-select-opened',
    'text::frost-select-placeholder'
  ],

  layout,

  // == PropTypes =============================================================

  propTypes: {
    // options
    autofocus: PropTypes.bool,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    label: PropTypes.string,
    secondaryLabels: PropTypes.arrayOf(PropTypes.string),
    multiselect: PropTypes.bool,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onInput: PropTypes.func,
    renderTarget: PropTypes.string,
    role: PropTypes.string,
    selected: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.number
    ]),
    selectedValue: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.bool,
      PropTypes.number,
      PropTypes.null,
      PropTypes.object,
      PropTypes.string
    ]),
    tabIndex: PropTypes.number,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.null]),
    wrapLabels: PropTypes.bool,

    // state
    $element: PropTypes.object,
    focused: PropTypes.bool,
    internalSelectedValue: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.bool,
      PropTypes.number,
      PropTypes.null,
      PropTypes.object,
      PropTypes.string
    ]),
    opened: PropTypes.bool,
    debounceInterval: PropTypes.number
  },

  getDefaultProps () {
    return {
      // options
      autofocus: false,
      disabled: false,
      error: false,
      multiselect: false,
      renderTarget: 'frost-select',
      role: 'button',
      tabIndex: 0,
      debounceInterval: 0,
      // state
      focused: false
    }
  },

  // == Computed Properties ===================================================

  @computed('label', 'opened')
  get ariaLabel () {
    const verb = this.get('opened') ? 'Hide' : 'Show'
    const label = this.get('label')

    if (label) {
      return `${verb} ${label} combobox`
    }

    return `${verb} combobox`
  },

  @computed('data', 'filter', 'onInput')
  get items () {
    let data = this.get('data')
    // If no data to filter we are done
    if (!data) {
      return []
    }

    // External filtering
    if (typeOf(this.get('onInput')) === 'function') {
      return data
    }

    // Internal filtering
    let filter = this.get('filter')
    filter = filter ? filter.toLowerCase() : ''

    return data
      .filter((item) => {
        if (!filter) {
          return true
        }

        const label = item.label || ''
        const secondaryLabels = item.secondaryLabels || []

        if (label.toLowerCase().indexOf(filter) !== -1) {
          return true
        }

        const filteredSecondaryLabels = secondaryLabels.filter(function (secondaryLabel) {
          if (secondaryLabel.toLowerCase().indexOf(filter) !== -1) {
            return true
          }
        })
        return filteredSecondaryLabels.length > 0
      })
  },

  @computed('data', 'selected', 'internalSelectedValue')
  /* eslint-disable complexity */
  get selectedItems () {
    const selectedValue = this.get('internalSelectedValue')
    let items = this.get('data')

    if (selectedValue !== undefined) {
      return items.filter((item) => {
        if (typeOf(selectedValue) === 'array') {
          return selectedValue.indexOf(item.value) !== -1
        }

        return item.value === selectedValue
      })
    }

    let selected = this.get('selected')

    if (typeOf(selected) === 'array') {
      return selected
        .filter((itemIndex) => itemIndex >= 0 && itemIndex < items.length)
        .map((itemIndex) => items[itemIndex])
    }

    if (selected !== undefined && selected <= 0 && selected < items.length) {
      return [items[selected]]
    }

    return []
  },
  /* eslint-enable complexity */

  @computed('disabled', 'tabIndex')
  /**
   * Get appropriate tab index
   * disabled state changes.
   * @param {Boolean} disabled - whether or not input is disabled
   * @param {Number} tabIndex - tab index
   * @returns {Number} tab index
   */
  get computedTabIndex () {
    return this.get('disabled') ? -1 : this.get('tabIndex')
  },

  @computed('selectedItems')
  get text () {
    const selectedItems = this.get('selectedItems')

    switch (selectedItems.length) {
      case 0:
        return null

      case 1:
        return selectedItems[0].label

      case 2:
        return `${selectedItems[0].label}, ${selectedItems[1].label}`
    }

    return `${selectedItems.length} items selected`
  },

  @computed('width')

  /**
   * Get a style string based on the presence of some properties
   * @param {String} width the width property specified
   * @returns {String} the completed style string
   */
  get style () {
    const width = this.get('width')
    let styles = ''

    // if a property is not falsy, append it to the style string
    // note that in the width case, we want the component interface to have absolute power over the width
    // so it will override any max or win widths to ensure ultimate control
    if (width) styles += `width: ${width}px; max-width: initial; min-width:initial; `
    return htmlSafe(styles);
  },

  @computed('items', 'selectedItems')
  /**
   * As of Ember 2.10, we have to make this a computed property to tell Ember to update our frost-select-dropdown.
   * Any properties that might be updated after the initial render should be observed by this property.
   * (@theotherdude 12/20/2017)
   * @returns {string} 'frost-select-dropdown'
   */
  get frostSelectDropdownName () {
    return 'frost-select-dropdown'
  },

  // == Tasks =================================================================

  /**
   * Fires input event after waiting for debounceInterval to clear
   * @param {Function} cb - Reference to onInput
   * @param {String} value - Filter String
   */
  inputTask: task(function * (cb, value) {
    const debounceInterval = this.get('debounceInterval')

    yield timeout(debounceInterval)
    cb(value)
  }).restartable(),

  // == Functions =============================================================

  // == DOM Events ============================================================

  _onClick: on('click', function (e) {
    if (!this.get('disabled')) {
      this.toggleProperty('opened')
    }
    if (this.onClick) {
      this.onClick(e)
    }
  }),

  _onKeyDown: on('keyDown', function (e) {
    if (
      [DOWN_ARROW, UP_ARROW].indexOf(e.keyCode) !== -1 &&
      !this.get('openend')
    ) {
      e.preventDefault() // Keep up/down arrow from scrolling page
      e.stopPropagation()
      this.set('opened', true)
    }
  }),

  _onKeyPress: on('keyPress', function (e) {
    if (e.keyCode === SPACE) {
      e.preventDefault() // Keep space from scrolling page
      e.stopPropagation()
      this.toggleProperty('opened')
    }
  }),

  _onFocusIn: on('focusIn', function () {
    // If select is disabled make sure it can't get focus
    if (this.get('disabled')) {
      this.$().blur()
    } else if (!this.get('focused')) {
      this.set('focused', true)

      const onFocus = this.get('onFocus')

      if (typeOf(onFocus) === 'function') {
        this.get('onFocus')()
      }
    }
  }),

  _onFocusOut: on('focusOut', function () {
    // We must use run.later so filter text input has time to focus when select
    // dropdown is being opened
    /* eslint-disable complexity */
    run.later(() => {
      if (this.isDestroyed || this.isDestroying) {
        return
      }

      const focusedElement = $(':focus')[0]
      const filterElement = $('.frost-select-dropdown .frost-text-input')[0]

      // If focus has moved to filter in select dropdown then keep select
      // visually focused and open
      if (filterElement && focusedElement === filterElement) {
        return
      }

      const isFocused = this.get('focused')
      const onBlur = this.get('onBlur')

      this.setProperties({
        focused: false,
        opened: false
      })

      if (typeOf(onBlur) === 'function' && isFocused) {
        this.get('onBlur')()
      }
    })
    /* eslint-enable complexity */
  }),

  // == Lifecycle Hooks =======================================================

  didInsertElement () {
    this._super(...arguments)

    // We need jQuery instance of components root DOM node to hand off to
    // dropdown so it can position itself properly relative to the select
    this.set('$element', this.$())

    // If autofocus and nothing else has focus, focus on select
    if (this.get('autofocus') && $(':focus').length === 0) {
      this.$().focus()
    }
  },

  didReceiveAttrs () {
    this._super(...arguments)

    const props = {}

    let newSelectedValue = this.get('selectedValue')
    let oldSelectedValue = this.get('_oldSelectedValue')

    // If user provided a new selected value and it doesn't match the internal
    // selected value then update internal selected value
    if (
      !compareSelectedValues(newSelectedValue, oldSelectedValue) &&
      !compareSelectedValues(newSelectedValue, this.get('internalSelectedValue'))
    ) {
      props.internalSelectedValue = newSelectedValue
    }

    if (Object.keys(props).length !== 0) {
      this.setProperties(props)
    }

    this.set('_oldSelectedValue', newSelectedValue)
  },

  // == Actions ===============================================================

  actions: {
    closeDropDown () {
      this.setProperties({
        filter: '',
        opened: false
      })

      // We need to make sure focus goes back to select since it is on the
      // filter text input while the dropdown is open
      this.$().focus()
    },

    filterInput (e) {
      const inputTask = this.get('inputTask')
      const onInput = this.get('onInput')

      const filter = e.target.value

      if (typeOf(onInput) === 'function') {
        inputTask.perform(onInput, filter)
      } else {
        this.set('filter', filter)
      }
    },

    selectItem (selectedValue) {
      const isMultiselect = this.get('multiselect')
      const props = {
        opened: isMultiselect,
        internalSelectedValue: selectedValue
      }

      if (!isMultiselect) {
        props.filter = ''
      }

      this.setProperties(props)

      const onChange = this.get('onChange')

      if (typeOf(onChange) === 'function') {
        run.next(() => {
          this.onChange(selectedValue)
        })
      }

      // We need to make sure focus goes back to select since it is on the
      // filter text input while the dropdown is open
      this.$().focus()
    }
  }
})
