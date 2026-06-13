/**
 * selectorTooltips.js — helpers OPCIONALES para IndicatorSelector.
 *
 * El panel ya consume la forma nativa de GetFabIndicators / GetFabBoundaries
 * (categoría con Items = Array | { parent: Item[] }). No hay traducción
 * estructural.
 *
 * Lo único que el panel no deriva por sí mismo es el contenido del tooltip:
 * lo pinta desde `item.Info` si está presente. Estas funciones construyen ese
 * `Info`. Podés:
 *   · llamarlas en la capa que recibe el JSON (un map sobre los items), o
 *   · trasladar la misma lógica al backend y emitir `Info` directamente
 *     (entonces este archivo no hace falta).
 *
 * Formato de Info que espera el panel:
 *   { Title, Sections: [{ Label, Text } | { Label, List:[] } | { Label, Tags:[] }] }
 */

// ── Indicadores ──────────────────────────────────────────────────────────────

function indicatorVariables(item) {
  const ret = [];
  for (const version of item.Versions || []) {
    for (const level of version.Levels || []) {
      for (const variable of level.Variables || []) {
        const name = variable.Name === 'N' ? 'Conteo' : variable.Name;
        if (name && !ret.includes(name)) ret.push(name);
      }
    }
  }
  if (!ret.length) ret.push('Conteo');
  return ret;
}

function indicatorLevels(item) {
  const ret = [];
  for (const version of item.Versions || []) {
    for (const level of version.Levels || []) {
      if (level.Name && !ret.includes(level.Name)) ret.push(level.Name);
    }
  }
  return ret;
}

export function buildIndicatorInfo(item, container, parentName) {
  const sections = [
    { Label: 'Variables', List: indicatorVariables(item) },
    { Label: 'Niveles', Text: indicatorLevels(item).join(', ') },
  ];
  if (item.Versions && item.Versions.length) {
    sections.push({ Label: 'Versiones', Tags: item.Versions.map(v => v.Name) });
  }
  // El nombre del proveedor coincide con la clave de agrupación (item.Parent).
  sections.push({ Label: 'Fuente', Text: parentName || item.Parent || 'Otras fuentes' });
  return { Title: item.Name, Sections: sections };
}

// ── Regiones ─────────────────────────────────────────────────────────────────

function formatPopulation(value) {
  if (!value || value <= 0) return 'No disponible';
  return new Intl.NumberFormat('es-AR').format(value);
}

// container = nodo tipo (Provincias, Departamentos, ...); parentName = clave del
// diccionario cuando las hojas vienen agrupadas por padre.
// Devuelve null cuando el tooltip no informaria nada (sin padre y sin poblacion):
// en ese caso el panel no ofrece el boton (i).
export function buildBoundaryInfo(item, container, parentName) {
  const parent = parentName || item.Parent || null;
  const hasPopulation = item.Population > 0;
  if (!parent && !hasPopulation) return null;

  const sections = [];
  if (container && container.Name) {
    sections.push({ Label: 'Tipo de delimitación', Text: container.Name });
  }
  if (parent) {
    sections.push({ Label: 'Pertenece a', Text: parent });
  }
  sections.push({ Label: 'Población', Text: formatPopulation(item.Population) });
  return { Title: item.Name, Sections: sections };
}

// ── Aplica Info a todas las hojas (in place), a cualquier profundidad ─────────
// `build` es buildIndicatorInfo o buildBoundaryInfo. Misma heurística rama/hoja
// que el componente: un nodo cuyos elementos de Items tienen a su vez Items es
// una rama; en otro caso, sus elementos son hojas.

function walkLeaves(nodes, fn) {
  for (const node of nodes) {
    const items = node.Items;
    if (Array.isArray(items)) {
      if (items.length && items[0] && items[0].Items !== undefined) {
        walkLeaves(items, fn);
      } else {
        for (const leaf of items) fn(leaf, node, null);
      }
    } else if (items && typeof items === 'object') {
      for (const parent of Object.keys(items)) {
        for (const leaf of items[parent]) fn(leaf, node, parent);
      }
    }
  }
  return nodes;
}

export function attachInfo(categories, build) {
  return walkLeaves(categories, (leaf, container, parentName) => {
    if (leaf.Info) return;
    const info = build(leaf, container, parentName);
    if (info) leaf.Info = info;
  });
}

// ── Chip para la prop `selection` ─────────────────────────────────────────────

export function toChip(item) {
  return {
    Id: item.Id,
    Caption: item.Name,
    Description: (item.Info && item.Info.Title) || item.Name,
    Item: item,
  };
}

export default { buildIndicatorInfo, buildBoundaryInfo, attachInfo, toChip };
