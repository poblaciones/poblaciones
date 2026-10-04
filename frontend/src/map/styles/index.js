/*
 * Hojas globales del visor, en el orden en que se cargan. El orden es significativo.
 *
 * Las dos hojas vendor-overrides conservan la posición que tenían respecto de leaflet.css y nprogress.css,
 * porque varias reglas sin !important dependen de ganarles o de perder contra ellas. Unificarlas en una sola
 * posición exige resolver esos conflictos regla por regla.
 */
import '@/common/styles/popovers.css';
import '@/common/styles/transition.css';
import '@/map/styles/vendor-overrides.css';
import '@/map/styles/layout.css';
import '@/map/styles/helpers.css';
import '@/map/styles/map-content.css';
import '@/map/styles/panels.css';
import '@/map/styles/lists.css';
import '@/map/styles/export.css';
import '@/map/styles/transitions.css';

import 'leaflet/dist/leaflet.css';
import 'axios-progress-bar/dist/nprogress.css';

import '@/common/styles/buttons.css';
import '@/common/styles/list-items.css';
import '@/common/styles/chips.css';
import '@/common/styles/switch.css';
import '@/common/styles/search.css';
import '@/map/styles/fields.css';
import '@/map/styles/vendor-overrides-late.css';
