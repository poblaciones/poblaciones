import { describe, it, expect } from './_harness.mjs';
import OverlapRectangles from '@/map/classes/OverlapRectangles';

// La clase evita superposiciones de overlays en pantalla: guarda los bounds de
// los overlays ya ubicados por nivel de zoom y responde si un overlay nuevo
// pisa alguno. Coordenadas de pantalla: top < bottom.

function rect(top, bottom, left, right) {
        return { top, bottom, left, right };
}

function overlay(zoom, bounds) {
        return { zoom, Bounds: bounds };
}

describe('OverlapRectangles: registro de overlays');

it('agrega y quita rectángulos', () => {
        const ov = new OverlapRectangles();
        const a = overlay(10, rect(0, 10, 0, 10));
        ov.AddRectangle(a);
        expect(ov.Rectangles).toHaveLength(1);
        ov.RemoveRectangle(a);
        expect(ov.Rectangles).toHaveLength(0);
        // quitar uno que no está no hace nada
        ov.RemoveRectangle(a);
        expect(ov.Rectangles).toHaveLength(0);
});

it('Intersects responde true con solape interior y también con bordes que se tocan', () => {
        const ov = new OverlapRectangles();
        // el primer Intersects fija el zoom y descarta lo cargado antes del primer
        // chequeo de zoom: el registro útil se hace después de esa primera llamada
        expect(ov.Intersects(overlay(10, rect(0, 10, 0, 10)))).toBe(false);
        ov.AddRectangle(overlay(10, rect(0, 10, 0, 10)));
        expect(ov.Intersects(overlay(10, rect(5, 15, 5, 15)))).toBe(true);
        expect(ov.Intersects(overlay(10, rect(10, 20, 10, 20)))).toBe(true);
        expect(ov.Intersects(overlay(10, rect(11, 20, 11, 20)))).toBe(false);
});

describe('OverlapRectangles: caché por nivel de zoom');

it('CheckZoomLevel limpia los rectángulos al cambiar de zoom', () => {
        const ov = new OverlapRectangles();
        ov.AddRectangle(overlay(10, rect(0, 10, 0, 10)));
        // primer chequeo: fija el zoom actual y descarta lo previo
        ov.CheckZoomLevel(10);
        expect(ov.Rectangles).toHaveLength(0);
        ov.AddRectangle(overlay(10, rect(0, 10, 0, 10)));
        ov.CheckZoomLevel(10);
        expect(ov.Rectangles).toHaveLength(1);
        ov.CheckZoomLevel(11);
        expect(ov.Rectangles).toHaveLength(0);
        expect(ov.currentZoomLevel).toBe(11);
});

it('Intersects reacciona al zoom del overlay: con zoom nuevo la caché arranca vacía', () => {
        const ov = new OverlapRectangles();
        ov.AddRectangle(overlay(10, rect(0, 10, 0, 10)));
        // mismo rectángulo, otro zoom: la caché se limpia y no hay solape
        expect(ov.Intersects(overlay(11, rect(5, 15, 5, 15)))).toBe(false);
        expect(ov.Rectangles).toHaveLength(0);
});
