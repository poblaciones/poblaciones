// Las capas de deck.gl solo registran las props con que se construyeron.
class StubLayer {
	constructor(props) {
		this.props = props;
	}
	clone(newProps) {
		return new this.constructor(Object.assign({}, this.props, newProps));
	}
}
export class IconLayer extends StubLayer {}
export class PolygonLayer extends StubLayer {}
export class ScatterplotLayer extends StubLayer {}
export class GeoJsonLayer extends StubLayer {}
