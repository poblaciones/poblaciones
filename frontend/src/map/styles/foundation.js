/*
 * Hojas que sustituyen a Bootstrap 3 y Paper Dashboard.
 * main.js las importa antes que cualquier componente para que queden en el lugar más bajo de la cascada,
 * el mismo que tenían las hojas de esas librerías cuando index.html las cargaba.
 */
import '@/common/styles/tokens.css';
import '@/common/styles/base.css';
import '@/common/styles/utilities.css';
import '@/common/styles/animations.css';
import '@/map/styles/tooltips.css';
import '@/map/styles/surfaces.css';
import '@/map/styles/menus.css';
