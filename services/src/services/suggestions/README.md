# Sistema de Sugerencias Inteligentes - Refactorizado

Sistema de recomendaciones interpretable adaptado a la arquitectura Helena.

## 📂 Estructura de Archivos

```
/helena/classes/suggestions/
├── SuggestionsSettings.php      # Configuración (App::Settings()->Suggestions())
├── DatabaseHelper.php           # Helper para SQLite mensuales (crea schemas automáticamente)
├── PatternAnalyzer.php          # Extracción y análisis de patrones
├── MonthlyAnalyzer.php          # Procesamiento mensual con decaimiento
├── SuggestionEngine.php         # Motor de sugerencias en tiempo real
├── SuggestionsService.php       # Lógica de negocio para API
├── ProcessingService.php        # Gestión de procesamiento manual
└── DashboardService.php         # Datos para vistas web

/routes/
├── suggestions.php              # API REST para sugerencias
├── processing.php               # API REST para procesamiento
└── suggestions_web.php          # Vistas web (dashboard, processing)

/templates/
├── suggestions_dashboard.html   # Dashboard de estadísticas
└── suggestions_processing.html  # Gestión de procesamiento

/sql/
└── schema_mysql.sql             # Schema para MySQL (modelo)
```

**Nota**: El schema SQLite para sugerencias mensuales está integrado en `DatabaseHelper.php` y se crea automáticamente.

## 🔧 Instalación

### 1. Crear Tablas MySQL

```bash
mysql -u usuario -p helena_db < sql/schema_mysql.sql
```

**Nota**: Las bases SQLite mensuales (`suggestions-YYYY-MM.db`) se crean automáticamente cuando se necesitan, no requieren configuración manual.

### 2. Configurar Rutas de Archivos

Agregar a `Paths.php`:

```php
public static function GetSuggestionsFolder() {
    return self::GetDataPath() . 'suggestions/';
}
```

Crear el directorio:

```bash
mkdir -p /var/www/helena/data/suggestions
chmod 755 /var/www/helena/data/suggestions
```

### 3. Registrar Settings

En tu configuración de Settings, agregar:

```php
private $suggestions;

public function Suggestions() {
    if ($this->suggestions === null) {
        $this->suggestions = new \helena\classes\suggestions\SuggestionsSettings();
    }
    return $this->suggestions;
}
```

### 4. Incluir Rutas

En tu archivo principal de rutas:

```php
require_once __DIR__ . '/routes/suggestions.php';
require_once __DIR__ . '/routes/processing.php';
require_once __DIR__ . '/routes/suggestions_web.php';
```

## 🚀 Uso

### Procesamiento Mensual

**Opción 1: Script Manual**

```php
<?php
// /scripts/process_suggestions.php
require_once __DIR__ . '/../bootstrap.php';

use helena\classes\suggestions\MonthlyAnalyzer;

$year = (int)($argv[1] ?? date('Y'));
$month = (int)($argv[2] ?? date('n') - 1);

$analyzer = new MonthlyAnalyzer($year, $month, true);
$result = $analyzer->run();

echo "Completado: " . json_encode($result['stats']) . "\n";
```

**Opción 2: Desde Web**

Ir a: `https://tu-dominio.com/admin/suggestions/processing`

**Opción 3: Cron Job**

```cron
0 2 1 * * cd /var/www/helena && php scripts/process_suggestions.php
```

### API de Sugerencias

**Solicitar Sugerencias:**

```javascript
POST /services/suggestions/GetSuggestions

{
  "navigation_id": 12345,
  "session_fingerprint": "abc123",
  "current_metrics": [6001, 8701],
  "current_variables": { "6001": [17201] },
  "current_zoom": 14,
  "recent_actions": [
    { "type": "Content", "name": "AddMetric", "value": "6001" }
  ],
  "content_actions_count": 5
}
```

**Respuesta:**

```json
{
  "success": true,
  "should_suggest": true,
  "trigger_reason": "after_n_actions",
  "suggestions": [
    {
      "id": 456,
      "type": "metric",
      "value": 3601,
      "score": 0.742,
      "reason": "cooccurrence",
      "rank": 1
    }
  ]
}
```

**Registrar Feedback:**

```javascript
POST /services/suggestions/RegisterFeedback

{
  "suggestion_id": 456,
  "accepted": true,
  "time_to_decision_ms": 3500
}
```

## 🔍 Características Clave

### 1. Estrategia de Merge y Decaimiento

Cada mes:
1. **Decaimiento**: Multiplica `count` de reglas existentes por factor (default: 0.95)
2. **Merge**: Suma nuevos counts a los existentes (decaídos)
3. **Recalcula**: Actualiza probabilidades, confidence, etc.

Ejemplo:
```
Mes 1: Metric A→B aparece 100 veces → count=100
Mes 2: Decaimiento count=100*0.95=95, nuevas 50 apariciones → count=145
Mes 3: Decaimiento count=145*0.95=137, nuevas 30 apariciones → count=167
```

**Beneficio**: Balance entre memoria (recuerda patrones históricos) y adaptación (prioriza comportamiento reciente).

### 2. Tablas SQLite Mensuales

- Navegación: `/data/navigation/2024-01.db`
- Sugerencias: `/data/suggestions/suggestions-2024-01.db`

**Beneficio**: No hay archivos gigantes, fácil archivar meses viejos.

### 3. Prefijos de Tabla

Todas las tablas MySQL siguen el patrón:
- `suggestions_metric_cooccurrence` → Prefijo: `smc_`
- `suggestions_sequences` → Prefijo: `ssq_`
- etc.

### 4. Interpretabilidad Total

Ver qué aprendió el modelo:

```sql
-- Top co-ocurrencias
SELECT smc_metric_a, smc_metric_b, smc_lift, smc_acceptance_rate
FROM suggestions_metric_cooccurrence
ORDER BY smc_lift DESC LIMIT 20;

-- Secuencias más comunes
SELECT ssq_pattern_json, ssq_next_action_name, ssq_probability
FROM suggestions_sequences
WHERE ssq_probability > 0.3;
```

## 📊 Dashboard Web

Acceder a: `https://tu-dominio.com/admin/suggestions/dashboard`

Muestra:
- Estado del modelo (total reglas, sesiones analizadas)
- Evolución mensual (gráfico de aceptación)
- Top reglas más efectivas
- Estadísticas del mes actual

## ⚙️ Configuración

Editar en `SuggestionsSettings.php`:

```php
private $zoomRanges = [
    [1, 6, 'macro'],
    [7, 10, 'medio'],
    [11, 13, 'local'],
    [14, 18, 'micro']
];

private $minSupport = 3;          // Mínimo apariciones
private $minConfidence = 0.15;    // Mínima confianza (15%)
private $decayFactor = 0.95;      // Decaimiento mensual
```

## 🐛 Troubleshooting

**Error: "No existe el archivo de logs"**
- Verificar que existe `/data/navigation/YYYY-MM.db`
- Verificar permisos del directorio

**Error: "Table doesn't exist"**
- Ejecutar `schema_mysql.sql` en MySQL

**Las sugerencias no se guardan**
- Verificar que el directorio `/data/suggestions` existe y tiene permisos de escritura

**Tasa de aceptación muy baja**
- Aumentar `minConfidence` para sugerir solo patrones más fuertes
- Aumentar `suggestAfterNActions` para no sugerir tan frecuentemente

## 📈 Mejoras Futuras (Etapa 2)

Una vez estable (3-6 meses):

1. **Bandits Contextuales**: Aprendizaje continuo sin esperar análisis mensual
2. **Embeddings de Sesiones**: "Usuarios como tú también vieron..."
3. **A/B Testing**: Medir impacto real en métricas de negocio

## 🔗 Integración Frontend

Ver archivo `/examples/vue_integration.js` para ejemplo completo de integración con Vue.js.

## 📝 Licencia

[Tu licencia]

---

**Versión**: 2.0 (Refactorizado para Helena)
**Última actualización**: Febrero 2026
