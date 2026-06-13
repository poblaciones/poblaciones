/**
 * selectorSubtitles.js
 * ---------------------------------------------------------------------------
 * Calcula el campo `Subtitle` de cada hoja ANTES de pasar el árbol al
 * componente. El panel lo muestra como subtítulo de la fila (idéntico en
 * navegación y en resultados de búsqueda).
 *
 * Recorre el árbol a cualquier profundidad con la misma heurística que el
 * componente: un nodo cuyos elementos de `Items` tienen a su vez `Items` es una
 * rama; en otro caso, sus elementos son hojas. `container` es el nodo directo
 * que contiene la hoja (el "tipo": Provincias, Departamentos…); `parentName`
 * es la clave del diccionario cuando las hojas vienen agrupadas por padre.
 *
 * Requisito de datos (no borrar en el servidor si esto corre en el front):
 *   · indicadores -> cada hoja conserva Versions[].Name
 *   · regiones    -> cada hoja conserva Parent (o viene como clave del diccionario)
 * ---------------------------------------------------------------------------
 */

function walkLeaves(nodes, fn) {
  for (const node of nodes) {
    const items = node.Items;
    if (Array.isArray(items)) {
      if (items.length && items[0] && items[0].Items !== undefined) {
        walkLeaves(items, fn);                       // rama: descender
      } else {
        for (const leaf of items) fn(leaf, node, null); // hojas planas
      }
    } else if (items && typeof items === 'object') {
      for (const parent of Object.keys(items)) {
        for (const leaf of items[parent]) fn(leaf, node, parent);
      }
    }
  }
  return nodes;
}

// Indicadores: el subtitulo son los anios de las versiones.
export function addIndicatorSubtitles(categories) {
  return walkLeaves(categories, (leaf) => {
    leaf.Subtitle = (leaf.Versions || []).map(v => v.Name).join(', ');
  });
}

// Regiones: el subtitulo es "Parent > Tipo" (Tipo = nombre del contenedor
// directo de la hoja). Una hoja sin padre (una provincia) queda con el
// nombre del tipo solamente.
export function addBoundarySubtitles(categories) {
  return walkLeaves(categories, (leaf, container, parentName) => {
    const parent = parentName || leaf.Parent;
    leaf.Subtitle = parent ? parent + ' > ' + container.Name : container.Name;
  });
}

export default { addIndicatorSubtitles, addBoundarySubtitles };
