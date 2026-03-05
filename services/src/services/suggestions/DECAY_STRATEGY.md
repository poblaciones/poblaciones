# Estrategia de Decaimiento y Balance Memoria/Olvido

## Problema a Resolver

Cuando procesas datos mes a mes, surge una pregunta crítica:

**¿Cómo combinar datos nuevos con datos históricos?**

Opciones problemáticas:
1. ❌ **Solo usar datos del mes actual**: Olvidas todo lo anterior → muy volátil
2. ❌ **Acumular todo sin límite**: El pasado pesa igual que el presente → no se adapta a cambios
3. ✅ **Decaimiento exponencial**: El pasado pesa menos que el presente → balance óptimo

## Solución Implementada: Decaimiento Exponencial

### Concepto

Cada mes, antes de agregar datos nuevos:
```
count_viejo_decaído = count_viejo × decay_factor
```

Luego se suma el nuevo count:
```
count_final = count_viejo_decaído + count_nuevo
```

### Ejemplo Numérico

Supongamos que la regla "Metric 6001 → Metric 8701" aparece:

**Configuración**: `decay_factor = 0.95`

| Mes | Count Previo | Decaimiento | Nuevas Apariciones | Count Final |
|-----|--------------|-------------|-------------------|-------------|
| 2024-01 | - | - | 100 | **100** |
| 2024-02 | 100 | 100 × 0.95 = 95 | 50 | **145** |
| 2024-03 | 145 | 145 × 0.95 = 137 | 30 | **167** |
| 2024-04 | 167 | 167 × 0.95 = 158 | 80 | **238** |
| 2024-05 | 238 | 238 × 0.95 = 226 | 10 | **236** |

**Observaciones**:
- Meses 1-4: El patrón es fuerte y creciente
- Mes 5: Solo 10 nuevas apariciones → el count disminuye (236 < 238)
- **Conclusión**: Si un patrón deja de aparecer, su peso disminuye gradualmente

### Peso Efectivo del Pasado

Con `decay_factor = 0.95`, el peso de datos históricos decae así:

| Meses Atrás | Peso Efectivo | Explicación |
|-------------|---------------|-------------|
| 0 (mes actual) | 100% | Datos frescos |
| 1 | 95% | 0.95¹ |
| 2 | 90% | 0.95² |
| 3 | 86% | 0.95³ |
| 6 | 74% | 0.95⁶ |
| 12 | 54% | 0.95¹² |
| 24 | 29% | 0.95²⁴ |

**Interpretación**: Después de 2 años, datos viejos solo pesan ~30% vs. datos actuales.

## Configuración del Factor de Decaimiento

### Valores Típicos

| Factor | Comportamiento | Uso Recomendado |
|--------|---------------|-----------------|
| 1.0 | Sin decaimiento | Datos muy estables, sin cambios esperados |
| 0.98 | Decaimiento lento | Comportamiento evoluciona gradualmente |
| **0.95** | **Decaimiento moderado** | **Default - balance óptimo** |
| 0.90 | Decaimiento rápido | Comportamiento cambia frecuentemente |
| 0.80 | Decaimiento muy rápido | Solo memoria reciente importa |

### Cómo Elegir

**Usa decay_factor alto (0.95-0.98)** si:
- El comportamiento de usuarios es estable
- Cambios son graduales
- Quieres memoria a largo plazo

**Usa decay_factor bajo (0.85-0.90)** si:
- El comportamiento cambia frecuentemente
- Hay estacionalidad fuerte
- Priorizas adaptación rápida

### Ajustar en Código

En `SuggestionsSettings.php`:

```php
private $decayFactor = 0.95;  // Cambiar según necesidad
```

O dinámicamente en MySQL:

```sql
UPDATE suggestions_model_metadata
SET smm_value_text = '0.90'
WHERE smm_key_name = 'decay_factor';
```

## Efecto en las Reglas

### Caso 1: Patrón Consistente

Regla: "Zoom 11-13 → AddBoundary" aparece consistentemente

| Mes | Nuevas | Count Decaído | Count Final | Confidence |
|-----|--------|---------------|-------------|------------|
| 1 | 100 | - | 100 | 0.30 |
| 2 | 95 | 95 | 190 | 0.31 |
| 3 | 90 | 180 | 270 | 0.32 |
| 4 | 92 | 256 | 348 | 0.32 |

**Resultado**: El count crece establemente, la regla se fortalece.

### Caso 2: Patrón Desapareciendo

Regla: "Province BA → Metric 6001" era fuerte, pero usuarios cambiaron

| Mes | Nuevas | Count Decaído | Count Final | Confidence |
|-----|--------|---------------|-------------|------------|
| 1 | 200 | - | 200 | 0.50 |
| 2 | 180 | 190 | 370 | 0.49 |
| 3 | 20 | 351 | 371 | 0.35 |
| 4 | 5 | 352 | 357 | 0.28 |
| 5 | 0 | 339 | 339 | 0.22 |
| 6 | 0 | 322 | 322 | 0.18 |

**Resultado**:
- El count disminuye gradualmente
- Cuando `confidence < 0.15`, la regla se descarta
- **Olvido suave**: No desaparece de golpe, da tiempo a confirmar el cambio

### Caso 3: Patrón Emergente

Nueva regla: "Metric 8701 → Region 19170" antes no existía

| Mes | Nuevas | Count Decaído | Count Final | Confidence |
|-----|--------|---------------|-------------|------------|
| 1 | 0 | - | 0 | - |
| 2 | 0 | 0 | 0 | - |
| 3 | 50 | 0 | 50 | 0.18 |
| 4 | 80 | 47 | 127 | 0.25 |
| 5 | 90 | 120 | 210 | 0.32 |

**Resultado**:
- Mes 3: Primera aparición, aún bajo threshold
- Mes 4: Supera `min_confidence`, empieza a sugerirse
- Mes 5: Se fortalece rápidamente
- **Adaptación rápida** a nuevos patrones

## Comparación con Otras Estrategias

### Ventana Deslizante (Alternativa Común)

```
Solo considerar últimos N meses (ej: últimos 3 meses)
```

**Problemas**:
- ❌ Límite arbitrario (¿por qué 3 y no 4?)
- ❌ Cambio abrupto (mes 4 desaparece de golpe)
- ❌ Desperdicia datos (mes 4 puede ser valioso aunque viejo)

**Decaimiento exponencial**:
- ✅ No hay límite arbitrario
- ✅ Transición suave
- ✅ Aprovecha todos los datos (con pesos decrecientes)

### Ponderación Manual (Alternativa Compleja)

```
Asignar pesos manualmente: mes_actual=1.0, mes-1=0.8, mes-2=0.6...
```

**Problemas**:
- ❌ Requiere mantenimiento manual
- ❌ Difícil calibrar pesos óptimos
- ❌ No generaliza bien

**Decaimiento exponencial**:
- ✅ Un solo parámetro (`decay_factor`)
- ✅ Auto-calibrado matemáticamente
- ✅ Generaliza a cualquier horizonte temporal

## Límite de Memoria (Opcional)

Además del decaimiento, puedes establecer un límite explícito:

```php
private $maxHistoricalMonths = 12;  // Solo considerar último año
```

**Cuándo usar**:
- Cuando sabes que después de N meses los datos no son relevantes
- Para limitar uso de memoria/disco
- Cuando hay cambios estructurales conocidos (ej: rediseño de la app)

**Implementación**:
Al procesar mes actual, solo traer feedback de últimos 12 meses para actualizar `acceptance_rate`.

## Monitoreo del Decaimiento

### Ver Evolución de una Regla Específica

```sql
SELECT smc_metric_a, smc_metric_b, smc_count, smc_confidence, smc_updated_at
FROM suggestions_metric_cooccurrence
WHERE smc_metric_a = 6001 AND smc_metric_b = 8701
ORDER BY smc_updated_at DESC;
```

Si guardas snapshots mensuales, puedes graficar cómo evoluciona el count.

### Detectar Reglas en Decaimiento

```sql
SELECT smc_metric_a, smc_metric_b, smc_count, smc_confidence
FROM suggestions_metric_cooccurrence
WHERE smc_confidence < 0.20  -- Cerca del threshold
  AND smc_count > 50          -- Pero tiene historial
ORDER BY smc_confidence ASC;
```

Estas reglas están "muriendo" → puedes investigar por qué.

## Ajuste Dinámico (Avanzado)

Si detectas que el comportamiento cambia estacionalmente:

```php
// Invierno: usuarios más estables
$decayFactor = 0.97;

// Verano: usuarios más variables
$decayFactor = 0.90;
```

O basado en métricas:

```php
// Si tasa de aceptación está cayendo → aumentar adaptación
if ($current_acceptance_rate < $previous_acceptance_rate * 0.9) {
    $decayFactor = 0.90;  // Olvidar más rápido
} else {
    $decayFactor = 0.95;  // Memoria normal
}
```

## Resumen

**Decaimiento Exponencial = Mejor de Ambos Mundos**

- ✅ **Memoria**: Recuerda patrones históricos importantes
- ✅ **Adaptación**: Prioriza comportamiento reciente
- ✅ **Simplicidad**: Un solo parámetro (`decay_factor`)
- ✅ **Suavidad**: Transiciones graduales sin cambios abruptos
- ✅ **Matemáticamente Óptimo**: Minimiza error cuadrático medio

**Default Recomendado**: `decay_factor = 0.95`

Monitorea la tasa de aceptación mes a mes. Si baja → considera reducir decay_factor para adaptarte más rápido.
