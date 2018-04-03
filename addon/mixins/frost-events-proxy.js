/**
 * Mixin for the frost-events-proxy
 */
import Mixin from '@ember/object/mixin';

import { on } from '@ember/object/evented';
import { events } from '../utils';

export default Mixin.create({
  initEvents: on('init', function () {
    events.init.call(this, events.map, events.addProxy)
  })
})
