<?php

namespace helena\classes\settings;

/**
 * Configuración del Sistema de Sugerencias
 * Se accede vía App::Settings()->Suggestions()
 */
class SuggestionsSettings {

    // Rangos de zoom significativos (ajustables según análisis)
    // [min, max, nombre_descriptivo]
    private $zoomRanges = [
        [1, 6, 'macro'],      // Vista país/región
        [7, 10, 'medio'],     // Vista provincial
        [11, 13, 'local'],    // Vista ciudad/departamento
        [14, 18, 'micro']     // Vista barrio/detalle
    ];

	public $useSuggestions = false;
	public $selectedUsers = [];

	// Configuración de análisis
    public $minSupport = 3;           // Mínimo de apariciones para considerar un patrón
    public $minConfidence = 0.15;     // Mínimo 15% de confianza
    public $minAcceptanceRate = 0.05; // 5% de aceptación mínima para mantener regla

    // Cuándo sugerir
    public $suggestAfterNActions = 5;        // Después de N acciones de contenido
    public $suggestAfterPauseMs = 8000;      // Después de 8 segundos sin acción
    public $maxSuggestionsPerTrigger = 5;    // Máximo 5 sugerencias a la vez
    public $minScoreToSuggest = 0.2;         // Score mínimo para mostrar sugerencia

    // Para detección de intención de abandono (heurística)
    public $abandonmentInactivityMs = 15000;  // 15 segundos sin acción

    // Factor de decaimiento para balance memoria vs olvido
    // 0.95 significa que datos antiguos pesan 95% vs nuevos
    public $decayFactor = 0.95;

    // Máximo de meses a considerar en el histórico
    public $maxHistoricalMonths = 6;

    public function __construct() {
        // Los valores por defecto están arriba
        // Podrían cargarse desde la base de datos si se necesita

        $this->minConfidence = 0.15;      // Bajado de 0.15
        $this->minScoreToSuggest = 0.2;  // Bajado de 0.20
        $this->suggestAfterNActions = 5;  // Bajado de 5
        $this->suggestAfterPauseMs = 8000;
		$this->maxHistoricalMonths = 6;
    }

    // ===== GETTERS =====

    public function getZoomRanges() {
        return $this->zoomRanges;
    }

    public function getMinSupport() {
        return $this->minSupport;
    }

    public function getMinConfidence() {
        return $this->minConfidence;
    }

    public function getMinAcceptanceRate() {
        return $this->minAcceptanceRate;
    }

    public function getSuggestAfterNActions() {
        return $this->suggestAfterNActions;
    }

    public function getSuggestAfterPauseMs() {
        return $this->suggestAfterPauseMs;
    }

    public function getMaxSuggestionsPerTrigger() {
        return $this->maxSuggestionsPerTrigger;
    }

    public function getMinScoreToSuggest() {
        return $this->minScoreToSuggest;
    }

    public function getAbandonmentInactivityMs() {
        return $this->abandonmentInactivityMs;
    }

    public function getDecayFactor() {
        return $this->decayFactor;
    }

    public function getMaxHistoricalMonths() {
        return $this->maxHistoricalMonths;
    }

    // ===== SETTERS (opcional, para ajuste dinámico) =====

    public function setZoomRanges($ranges) {
        $this->zoomRanges = $ranges;
        return $this;
    }

    public function setMinSupport($value) {
        $this->minSupport = $value;
        return $this;
    }

    public function setMinConfidence($value) {
        $this->minConfidence = $value;
        return $this;
    }

    public function setDecayFactor($value) {
        $this->decayFactor = max(0.0, min(1.0, $value)); // Entre 0 y 1
        return $this;
    }
}
