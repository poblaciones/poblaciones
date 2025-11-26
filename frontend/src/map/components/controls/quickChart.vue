<template>
    <div class="chart-panel"
         :style="{ width: actualWidth + 'px', height: height + 'px' }"
         @mousemove="updateTooltip"
         @mouseleave="hideTooltip">

        <svg :width="actualWidth" :height="height" class="chart-svg">

            <rect v-if="!isDonut"
                  class="chart-zone"
                  :x="paddingLeft"
                  :y="padding"
                  :width="Math.max(0, actualWidth - paddingLeft - padding - computedBars.extraRightPadding)"
                  :height="Math.max(0, height - 2 * padding)" />

            <g v-if="!isDonut">
                <line v-if="zeroPos >= padding && zeroPos <= (isHorizontal ? actualWidth : height) - padding"
                      :x1="isHorizontal ? zeroPos : paddingLeft"
                      :y1="isHorizontal ? padding : zeroPos"
                      :x2="isHorizontal ? zeroPos : actualWidth - padding - computedBars.extraRightPadding"
                      :y2="isHorizontal ? height - padding : zeroPos"
                      stroke="#dedede" stroke-width="1" />

                <text class="axis-label" :x="axisLabels.min.x" :y="axisLabels.min.y" :text-anchor="axisLabels.min.anchor">
                    {{ axisLabels.min.text }}
                </text>
                <text class="axis-label" :x="(axisLabels.min.x + axisLabels.max.x) / 2 - (isHorizontal ? 0 : 6)" :y="(axisLabels.min.y + axisLabels.max.y) / 2" :text-anchor="isHorizontal ? 'middle' : 'end'"
                      v-html="axisLabels.yLabel">

                </text>
                <text class="axis-label" :x="axisLabels.max.x" :y="axisLabels.max.y" :text-anchor="axisLabels.max.anchor">
                    {{ axisLabels.max.text }}
                </text>
            </g>

            <g v-if="!isDonut">
                <g v-for="(serie, sIndex) in computedBars" :key="'serie-' + sIndex">
                    <rect v-for="(bar, vIndex) in serie.items"
                          :key="'bar-' + sIndex + '-' + vIndex"
                          :x="bar.x" :y="bar.y" :width="Math.max(0, bar.width)" :height="bar.height"
                          :fill="bar.color"
                          :stroke="isSelected(sIndex, vIndex) ? '#333' : darkenColor(bar.color, 20)"
                          :stroke-width="isSelected(sIndex, vIndex) ? 1 : 0.5"
                          class="chart-element" :class="(isSelectedSerie(sIndex) ? '' : 'chart-element-inactive')"
                          @click.stop="selectElement(sIndex, vIndex)"
                          @mouseenter="hoverElement($event, sIndex, vIndex, bar.data)" />

                    <template v-if="!isHorizontal">
                        <text class="axis-label" :x="centerOfBarsX(serie.items)" :y="axisLabels.min.y + 14"
                              :class="(isSelectedManySerie(sIndex) ? 'axis-label-active' : '')"
                              text-anchor="middle">
                            {{ data.series[sIndex].text }}
                        </text>
                        <line :x1="centerOfBarsX(serie.items)"
                              :y1="axisLabels.min.y"
                              :x2="centerOfBarsX(serie.items)"
                              :y2="axisLabels.min.y + 4"
                              stroke="#c0c0c0" stroke-width="2" />
                    </template>
                    <template v-else>
                        <text class="axis-label" :y="centerOfBarsY(serie.items) + 3" :x="axisLabels.min.x - 6"
                              :class="(isSelectedManySerie(sIndex) ? 'axis-label-active' : '')"
                              text-anchor="end">
                            {{ data.series[sIndex].text }}
                        </text>
                        <line :y1="centerOfBarsY(serie.items)"
                              :x1="axisLabels.min.x"
                              :y2="centerOfBarsY(serie.items)"
                              :x2="axisLabels.min.x - 3"
                              stroke="#c0c0c0" stroke-width="2" />
                    </template>

                </g>
            </g>

<g v-else :transform="`translate(${actualWidth/2}, ${height/2})`">
    <g v-for="(ring, sIndex) in computedDonut" :key="'ring-' + sIndex">
        <path v-for="(slice, vIndex) in ring.slices"
              :key="'slice-' + sIndex + '-' + vIndex"
              :d="slice.path"
              :fill="slice.color"
              :stroke="isSelected(sIndex, vIndex) ? '#333' : darkenColor(slice.color, 20)"
              stroke-width="1"
              class="chart-element" :class="(isSelectedManySerie(sIndex) ? '' : 'chart-element-donut-inactive')"
              @click.stop="selectElement(sIndex, vIndex)"
              @mouseenter="hoverElement($event, sIndex, vIndex, slice.data)" />

    </g>
    <text class="axis-label" :x="axisLabels.min.x" :y="axisLabels.min.y" :text-anchor="'end'">
        {{ axisLabels.yLabel }}
    </text>
</g>
        </svg>

<div v-if="tooltip.visible"
     class="chart-tooltip"
     :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }">
    <div class="tooltip-header">{{ tooltip.seriesName }}</div>
    <div>
        <span class="dot" :style="{background: tooltip.color}"></span>
        {{ tooltip.label }}: <strong>{{ tooltip.valueFormatted }}</strong>
    </div>
</div>
    </div>
</template>

<script>
    export default {
        name: 'ChartPanel',
        props: {
            data: Object,
            selected: Object,
            yLabel: String,
            height: { type: Number, default: 300 },
            width: { type: Number, default: 400 },  // Opcional: solo como fallback
            stackedNormalize: Boolean
        },
        data: () => ({
            padding: 20,
            paddingLeft: 45,
            actualWidth: 400,
            extraRightPadding: 0,
            tooltip: { visible: false, x: 0, y: 0, label: '', valueFormatted: '', seriesName: '', color: '' },
            internalSelected: { seriesIndex: 0, valueIndex: -1 }
        }),
        mounted() {
            const el = this.$el;
            if (!el) return;

            // Inicializar con el tamaño real del contenedor
            const rect = el.getBoundingClientRect();
            this.actualWidth = rect.width || this.width;

            this.observer = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const { width } = entry.contentRect;
                    requestAnimationFrame(() => {
                        this.actualWidth = width;

                        console.log(this.actualWidth);;
                    });
                }
            });

            this.observer.observe(el);
        },

        beforeUnmount() {
            this.observer?.disconnect();
        },
        computed: {
            chartType() { return this.data.type || 'bar'; },
            isDonut() { return this.chartType === 'donut'; },
            isHorizontal() { return this.chartType.includes('horizontal'); },
            isStacked() { return this.chartType.includes('stacked'); },
            allValues() {
                let v = [];
                if (!this.data || !this.data.series) return [];
                this.data.series.forEach(s => s.values.forEach(i => v.push(i.value)));
                return v;
            },
            scaleLimits() {
                if (this.isDonut) return null;

                let min = 0, max = 0;

                // 1. Obtener Min y Max crudos de los datos
                if (this.isStacked && this.stackedNormalize) {
                    max = 100;
                    min = 0; // En % stack, el piso suele ser 0
					return { min: min, max: max };
                } else if (this.isStacked) {
                    const serieTotals = this.data.series.map(serie =>
                        serie.values.reduce((sum, item) => sum + item.value, 0)
                    );
                    max = Math.max(...serieTotals, 0);
                    min = Math.min(...serieTotals, 0);
                } else {
                    max = Math.max(...this.allValues, 0);
                    min = Math.min(...this.allValues, 0);
                }

                // 2. Aplicar "Buffer" (Aire) y Redondeo inteligente
                // Si el min es negativo (ej: -400), lo multiplicamos por 1.1 para que sea -440 antes de redondear.
                // Si el max es positivo (ej: 2100), lo multiplicamos por 1.1 para que sea 2310 antes de redondear.

                const niceMax = this.roundNice(max * 1.1);
                const niceMin = this.roundNice(min * 1.1);

                return { min: niceMin, max: niceMax };
            },
            zeroPos() {
                if (this.isDonut) return 0;
                const { min, max } = this.scaleLimits;
                const range = max - min || 1;

                if (this.isHorizontal) {
                    const W = this.actualWidth - this.paddingLeft - this.padding;
                    const ratio = (0 - min) / range;
                    return this.paddingLeft + (ratio * W);
                } else {
                    const H = this.height - 2 * this.padding;
                    const ratio = (0 - min) / range;
                    return (this.height - this.padding) - (ratio * H);
                }
            },
            computedBars() {
                if (this.isDonut) return [];
                const { min, max } = this.scaleLimits;
                const range = max - min || 1;

                // Ajustamos el área útil restando el paddingLeft
                const W = this.actualWidth - this.paddingLeft - this.padding;
                const H = this.height - this.padding * 2;

                const nSeries = this.data.series.length;

                const result = [];
                var offset = 0;
                var lastOffset = 0;
                var totalItems = 0;
                for (let sIdx = 0; sIdx < this.data.series.length; sIdx++) {
                    const serie = this.data.series[sIdx];
                    totalItems += serie.values.length;
                }

                for (let sIdx = 0; sIdx < this.data.series.length; sIdx++) {
                    const serie = this.data.series[sIdx];
                    const items = [];
                    let stackPos = 0;
                    let stackNeg = 0;
                    for (let vIdx = 0; vIdx < serie.values.length; vIdx++) {
                        const item = serie.values[vIdx];
                        let val = item.value;
                        let base = 0;

                        if (this.isStacked) {
                            if (this.stackedNormalize) {
                                let total = 0;
                                for (let vIdx2 = 0; vIdx2 < serie.values.length; vIdx2++) {
                                    const item2 = serie.values[vIdx2];
                                    total += Math.abs(item2.value);
                                }
                                val = total === 0 ? 0 : (item.value / total) * 100;
                            }
                            if (val >= 0) {
                                base = stackPos;
                                stackPos += val;
                            } else {
                                base = stackNeg;
                                stackNeg += val;
                            }
                        }

                        let rect = {};
                        if (!this.isHorizontal) {
                            // --- VERTICAL ---
                            var slotW = this.isStacked ? W / nSeries : W / (totalItems + nSeries);
                            const maxSize = this.isStacked ? 72 : 36;
                            if (slotW > maxSize) {
                                slotW = maxSize;
                            }
                            const minSize = 6;
                            if (slotW < minSize) {
                                slotW = minSize;
                            }
                            if (offset == 0) {
                                offset = slotW * .5;
                            }
                            const barW = this.isStacked ? slotW * 0.6 : slotW;
                            const offset2 = this.isStacked
                                ? (slotW * 0.15) + (slotW * sIdx)  // Todas las series comparten la misma posición X
                                : offset;

                            var x = this.paddingLeft + (vIdx * slotW) + offset2;
                            if (this.isStacked) {
                                x = this.paddingLeft + offset2 + slotW * 0.05;
                            }
                            const scaleY = (v) => (this.height - this.padding) - ((v - min) / range * H);
                            const y1 = scaleY(val + base);
                            const y2 = scaleY(base);

                            rect = {
                                x,
                                y: Math.min(y1, y2),
                                width: barW,
                                height: Math.abs(y2 - y1),
                                color: item.enabled === false ? '#E9E9E9' : item.color,
                                data: item
                            };
                            lastOffset = x - this.paddingLeft + slotW * 2;
                        } else {
                            // --- HORIZONTAL ---
                            var slotH = this.isStacked ? H / nSeries : H / (totalItems + nSeries);
                            const maxSize = this.isStacked ? 72 : 36;
                            if (slotH > maxSize) {
                                slotH = maxSize;
                            }
                            if (offset == 0) {
                                offset = slotH * .5;
                            }
                            const barH = this.isStacked ? slotH * 0.6 : slotH;
                            const offset2 = this.isStacked
                                ? (slotH * 0.15) + (slotH * sIdx)  // Todas las series comparten la misma posición X
                                : offset;

                            var y = this.padding + (vIdx * slotH) + offset2;
                            if (this.isStacked) {
                                y = this.padding + offset2 + slotH * 0.05;
                            }
                            const scaleX = (v) => this.paddingLeft + ((v - min) / range * W);
                            const x1 = scaleX(base);
                            const x2 = scaleX(base + val);

                            rect = {
                                x: Math.min(x1, x2),
                                y,
                                width: Math.abs(x2 - x1),
                                height: barH,
                                color: item.enabled === false ? '#ccc' : item.color,
                                data: item
                            };
                            lastOffset = y - this.padding + slotH * 2;
                        }

                        items.push(rect);
                    }
                    offset = lastOffset;
                    result.push({ items });
                }
                result.extraRightPadding = 0;
                return result;

            },
            computedRing() {
                const R = Math.min(this.actualWidth, this.height) / 2 - this.padding / 2;
                const ringW = (R * 0.7) / this.data.series.length;
                return { R, ringW };
            },
            computedDonut() {
                if (!this.isDonut) return [];
                const { R, ringW } = this.computedRing;

                const result = [];
                var nSeries = this.data.series.length;
                for (let sIdx = 0; sIdx < nSeries; sIdx++) {
                    const serie = this.data.series[sIdx];

                    // Calcular el total
                    let total = 0;
                    for (let v = 0; v < serie.values.length; v++) {
                        total += Math.abs(serie.values[v].value);
                    }

                    let angle = 0;
                    const outer = R - ((nSeries - sIdx - 1) * ringW);
                    const inner = outer - ringW + 2;

                    const slices = [];

                    for (let i = 0; i < serie.values.length; i++) {
                        const item = serie.values[i];
                        const sliceAngle = (Math.abs(item.value) / total) * 2 * Math.PI;
                        const path = this.arcPath(0, 0, outer, inner, angle, angle + sliceAngle);
                        angle += sliceAngle;

                        slices.push({
                            path,
                            color: item.enabled === false ? '#E9E9E9' : item.color,
                            data: item
                        });
                    }

                    result.push({ slices });
                }

                return result;
            },
            axisLabels() {
                if (this.isDonut) {
                    if (!this.isDonut) return [];
                    const { R, ringW } = this.computedRing;
                    return { min: { x: R * 0 - ringW - this.paddingLeft, y: 0 }, max: {}, yLabel: this.yLabel };
                }
                const { min, max } = this.scaleLimits;

                if (this.isHorizontal) {
                    return {
                        yLabel: this.yLabel,
                        min: { x: this.paddingLeft, y: this.height - 5, text: this.fmt(min), anchor: 'start' },
                        max: { x: this.actualWidth - this.padding, y: this.height - 5, text: this.fmt(max), anchor: 'end' }
                    };
                } else {
                    return {
                        yLabel: this.yLabel,
                        min: { x: this.paddingLeft - 6, y: this.height - this.padding, text: this.fmt(min), anchor: 'end' },
                        max: { x: this.paddingLeft - 6, y: this.padding + 10, text: this.fmt(max), anchor: 'end' }
                    };
                }
            }
        },
        methods: {
            centerOfBarsX(bars) {
                var min = 1000000;
                var max = 0;
                for (var bar of bars) {
                    if (bar.x < min) {
                        min = bar.x;
                    }
                    if (bar.x + bar.width > max) {
                        max = bar.x + bar.width;
                    }
                }
                return (min + max) / 2;
            },
			centerOfBarsY(bars) {
				var min = 1000000;
				var max = 0;
				for (var bar of bars) {
					if (bar.y < min) {
						min = bar.y;
					}
					if (bar.y + bar.height > max) {
						max = bar.y + bar.height;
					}
				}
				return (min + max) / 2;
			},
            roundNice(val) {
                if (val === 0) return 0;

                const sign = Math.sign(val);
                const abs = Math.abs(val);

                const mag = Math.pow(10, Math.floor(Math.log10(abs)));
                const norm = abs / mag;

                let niceNorm;

                if (norm <= 1) niceNorm = 1;
                else if (norm <= 1.25) niceNorm = 1.25;
                else if (norm <= 1.5) niceNorm = 1.5;
                else if (norm <= 2) niceNorm = 2;
                else if (norm <= 2.5) niceNorm = 2.5;
                else if (norm <= 3) niceNorm = 3;
                else if (norm <= 4) niceNorm = 4;
                else if (norm <= 5) niceNorm = 5;
                else niceNorm = 10;

                return sign * niceNorm * mag;
            },
            fmt(n) {
                const abs = Math.abs(n);
                if (abs >= 1000000) return (n / 1000000).toFixed(1) + 'M';
                if (abs >= 1000) return (n / 1000).toFixed(1) + 'k';
                return n;
            },
            darkenColor(color, percent) {
                // Acepta color en formato #RRGGBB o #RGB
                let c = color.startsWith('#') ? color.slice(1) : color;
                if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');

                const num = parseInt(c, 16);
                let r = (num >> 16) - percent * 2.55;
                let g = ((num >> 8) & 0x00FF) - percent * 2.55;
                let b = (num & 0x0000FF) - percent * 2.55;

                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));

                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            },
            hasMultipleSeries() {
                return this.data.series.length > 1;
            },
             isSelectedManySerie(s) {
                 return this.data.series.length > 1 && this.isSelected(s);
             },
            isSelectedSerie(s) {
                return this.internalSelected.seriesIndex == s;
            },
            isSelected(/*s, v*/) {
                return false;
                /*				if (!this.hasMultipleSeries() || this.isSelectedSerie(s)) {
                                    const sel = this.selected || this.internalSelected;
                                    return sel && sel.seriesIndex === s && sel.valueIndex === v;
                                }*/
            },
            selectSerie(s) {
                this.internalSelected = { seriesIndex: s, valueIndex: -1 };
                this.$emit('selectSerie', this.internalSelected);
            },
            selectElement(s, v) {
                if (this.hasMultipleSeries()) {
                    if (!this.isSelectedSerie(s)) {
                        // selecciona la serie
                        this.selectSerie(s);
                        return;
                    }
                }
                this.internalSelected = { seriesIndex: s, valueIndex: v };
                this.$emit('select', this.internalSelected);
            },
            hoverElement(e, s, v, d) {
                this.tooltip = {
                    visible: true,
                    label: d.label,
                    valueFormatted: this.fmt(d.value),
                    seriesName: this.data.series[s].text,
                    color: d.color,
                    x: e.clientX + 15,
                    y: e.clientY + 15
                };
            },
            updateTooltip(e) {
                // Si el elemento bajo el puntero no es parte del gráfico, ocultar el tooltip
                const target = e.target;
                if (!target.classList.contains('chart-element')) {
                    this.tooltip.visible = false;
                    return;
                }

                // Si sí lo es, actualizar posición normalmente
                this.tooltip.visible = true;
                this.tooltip.x = e.clientX + 15;
                this.tooltip.y = e.clientY + 15;

                var tooltipWidth = 120;
                var tooltipHeight = 40;
                const tooltipEl = this.$el.querySelector('.chart-tooltip');
                if (tooltipEl) {
                    const rect = tooltipEl.getBoundingClientRect();
                    tooltipWidth = rect.width;
                    tooltipHeight = rect.height;
                }
                if (this.tooltip.x + tooltipWidth + 15 > window.innerWidth) {
                    this.tooltip.x = e.clientX - tooltipWidth - 10;
                }
                if (this.tooltip.y + tooltipHeight + 15 > window.innerHeight) {
                    this.tooltip.y = e.clientY - tooltipHeight;
                }
            },
            hideTooltip() { this.tooltip.visible = false; },
            polar(cx, cy, r, a) { return { x: cx + r * Math.cos(a - Math.PI / 2), y: cy + r * Math.sin(a - Math.PI / 2) }; },
            arcPath(cx, cy, R, r, start, end) {
                const sOut = this.polar(cx, cy, R, end);
                const eOut = this.polar(cx, cy, R, start);
                const sIn = this.polar(cx, cy, r, end);
                const eIn = this.polar(cx, cy, r, start);
                const lg = end - start <= Math.PI ? "0" : "1";
                return `M ${sOut.x} ${sOut.y} A ${R} ${R} 0 ${lg} 0 ${eOut.x} ${eOut.y} L ${eIn.x} ${eIn.y} A ${r} ${r} 0 ${lg} 1 ${sIn.x} ${sIn.y} Z`;
            }
        }
    };
</script>

<style scoped>
    .chart-panel {
        position: relative;
        font-family: sans-serif;
        background: #fff;
        border: 0px solid #eee;
        overflow: hidden;
        width: 100%; /* IMPORTANTE: Permitir que siga al padre */
    }

    .chart-zone {
        fill: #fafafa;
        stroke: #e0e0e0;
        stroke-width: 0.5;
    }

    .axis-label {
        font-size: 11px;
        font-family: Muli, Arial, sans-serif;
        fill: #aaa;
    }

    .axis-label-active {
        font-weight: bold;
        fill: #666;
    }

    .chart-element {
        cursor: pointer;
        transition: opacity 0.2s;
        stroke-width: 1
    }

    .chart-element-donut-inactive {
        opacity: 0.3;
        filter: saturate(80%) brightness(80%) blur(0.3px);
        transition: filter 0.3s ease, opacity 0.3s ease;
    }

    .chart-element-inactive {
        opacity: 0.3;
        filter: saturate(50%) brightness(110%) blur(0.3px);
        transition: filter 0.3s ease, opacity 0.3s ease;
    }

    .chart-element:hover {
        opacity: 0.7;
    }

    /* Tooltip Fixed: Se sale del layout y flota sobre todo */
    .chart-tooltip {
        position: fixed; /* Cambiado de absolute a fixed */
        background: rgba(30, 30, 30, 0.9);
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 9999; /* Z-index alto */
        white-space: nowrap;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }

    .tooltip-header {
        border-bottom: 1px solid #555;
        margin-bottom: 3px;
        font-size: 10px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 5px;
    }
</style>
