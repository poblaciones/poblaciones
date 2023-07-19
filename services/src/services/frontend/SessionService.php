<?php

namespace helena\services\frontend;

use helena\classes\Paths;
use helena\classes\Session;
use helena\services\common\BaseService;
use minga\framework\Date;
use minga\framework\IO;
use minga\framework\GeoIp;
use minga\framework\Profiling;


class SessionService extends BaseService
{
    private $db = null;

    public function GetNavigationId()
    {
        IO::EnsureExists(Paths::GetNavigationFolder());
        $month = Date::GetLogMonthFolder();
        $path = Paths::GetNavigationFolder() . '/' . $month . ".db";
        $this->Open($path);
        $id = $this->insertNavigation($this->db);
        $this->Close();
        return ['month' => $month, 'id' => $id];
    }

	public function Save($month, $navigationId, $startup, $actions, $summary)
	{
        IO::EnsureExists(Paths::GetNavigationFolder());
        if (strlen($month) !== 7)
            throw new \Exception('Mes inválido');
        $path = Paths::GetNavigationFolder() . '/' . $month . ".db";
        $this->Open($path);
        $this->insertData($navigationId, $startup, $actions, $summary);
        $this->Close();
        return self::OK;
	}

    public function Open(string $path, bool $readonly = false): void
    {
        Profiling::BeginTimer();
        $existed = file_exists($path);
        $flag = ($readonly && $existed ? SQLITE3_OPEN_READONLY : SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
        $db = new \SQLite3($path, $flag);
        $db->enableExceptions(true);
        if ($existed == false)
            $this->createTables($db);

        $this->db = $db;
        if ($readonly == false)
            $this->db->busyTimeout(30000);
        $this->path = $path;
        $this->Execute('PRAGMA synchronous=OFF');
        $this->Execute('PRAGMA foreign_keys = ON');
        $this->Execute('PRAGMA journal_mode=WAL');
        Profiling::EndTimer();
    }
    public function Execute(string $sql, $args = [], $blobIndex = -1)
    {
        if (is_array($args) == false)
            $args = [$args];
        $text = $this->ParamsToText($sql, $args);
        try {
            $this->db->enableExceptions(true);
            $statement = $this->db->prepare($sql);
            $n = 1;
            foreach ($args as $arg) {
                $val = $arg;
                if (is_bool($arg))
                    $val = (int) $arg;
                if ($n - 1 === $blobIndex)
                    $statement->bindValue(':p' . ($n++), $val, SQLITE3_BLOB);
                else
                    $statement->bindValue(':p' . ($n++), $val);
            }
            return $statement->execute();
        } catch (\Exception $e) {
            throw new ErrorException($text . '. Error nativo: ' . $e->getMessage() . ".");
        }
    }

    public function Close(): void
    {
        Profiling::BeginTimer();
        $this->db->close();
        Profiling::EndTimer();
    }

    private function ParamsToText(string $sql, array $args): string
    {
        $text = 'No se ha podido completar la operación en SQLite. ';
        if ($this->path != null)
            $text .= 'Path: ' . $this->path;

        $text .= '. Comando: ' . $sql;
        $paramsAsText = '';
        foreach ($args as $arg) {
            if ($paramsAsText != '')
                $paramsAsText .= ', ';
            $paramsAsText .= $arg;
        }
        if ($paramsAsText == '')
            $paramsAsText = 'Ninguno';
        $text .= '. Parámetros: ' . $paramsAsText;
        return $text;
    }
    private function createTables($db) {
        // Definir la consulta SQL para crear la tabla navigation si no existe
        $query_navigation = "CREATE TABLE IF NOT EXISTS navigation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            startup TEXT,
            ip TEXT,
            client_id TEXT,
            is_authenticated INTEGER,
            is_mobile INTEGER,
            is_embedded INTEGER,
            screen_width INTEGER,
            screen_height INTEGER,
            day_week INTEGER,
            day_hour INTEGER
        )";

        // Ejecutar la consulta para crear la tabla navigation
        $db->exec($query_navigation);

        // Definir la consulta SQL para crear la tabla summary si no existe
        $query_summary = "CREATE TABLE IF NOT EXISTS summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            navigation_id INTEGER,
            scope_bounds_min_lat REAL,
            scope_bounds_min_lon REAL,
            scope_bounds_max_lat REAL,
            scope_bounds_max_lon REAL,
            scope_bounds_deltakm_ns REAL,
            scope_bounds_deltakm_we REAL,
            scope_bounds80_min_lat REAL,
            scope_bounds80_min_lon REAL,
            scope_bounds80_max_lat REAL,
            scope_bounds80_max_lon REAL,
            scope_bounds80_deltakm_ns REAL,
            scope_bounds80_deltakm_we REAL,
            scope_zoom_min INTEGER,
            scope_zoom_max INTEGER,
            scope_zoom_delta INTEGER,
            scope_zoom80_min INTEGER,
            scope_zoom80_max INTEGER,
            scope_zoom80_delta INTEGER,
            scope_years_min INTEGER,
            scope_years_max INTEGER,
            scope_activedurationsecs INTEGER,
            scope_durationsecs INTEGER,
            content_metrics INTEGER,
            content_boundaries INTEGER,
            content_regions INTEGER,
            content_downloads INTEGER,
            content_metadata INTEGER,
            content_circles INTEGER,
            content_elements INTEGER,
            FOREIGN KEY (navigation_id) REFERENCES navigation(id)
        )";

        // Ejecutar la consulta para crear la tabla summary
        $db->exec($query_summary);

        // Definir la consulta SQL para crear la tabla actions si no existe
        $query_actions = "CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            navigation_id INTEGER,
            action_type TEXT,
            action_name TEXT,
            action_value TEXT,
            time_ms INTEGER,
            FOREIGN KEY (navigation_id) REFERENCES navigation(id)
        )";

    // Ejecutar la consulta para crear la tabla actions
    $db->exec($query_actions);
}

    function insertData($id, $header, $actions, $summary)
    {
        $db = $this->db;
        if ($header)
            $this->updateNavigation($db, $id, $header);

        $navigation_id = $id;
        $this->insertActions($db, $navigation_id, $actions);
        $this->insertOrUpdateSummary($db, $navigation_id, $summary);
    }

    function insertNavigation($db)
    {
        $ip = GeoIp::GetCurrentIp();
        $is_authenticated = (Session::IsAuthenticated() ? 1 : 0);
        $service = new ConfigurationService();
        $client_id = $service->GetNavigationCookieId();
        if ($client_id == '')
            $client_id = $service->CreateNavigationCookie();
        try
        {
            $query_insert_navigation = "INSERT INTO navigation (ip, is_authenticated, client_id)
                                VALUES ('$ip', $is_authenticated, '$client_id')";
            $db->exec($query_insert_navigation);
        }
        catch(\Exception $ex)
        {
            if ($ex->getMessage() == 'table navigation has no column named client_id')
            {
                $alter = "ALTER TABLE navigation ADD COLUMN client_id TEXT;";
                $db->exec($alter);
                echo 'Sucessfully alterted table.';
                exit;
            }
            else
            {
                throw $ex;
            }
        }
        return $db->lastInsertRowID();
    }

    function updateNavigation($db, $id, $header)
    {
        $header_data = $header;
        $header_startup = $db->escapeString($header_data['Startup']);
        $header_is_mobile = $header_data['IsMobile'] ? 1 : 0;
        $header_is_embedded = $header_data['IsEmbedded'] ? 1 : 0;
        $header_screen_width = $header_data['Screen']['Width'];
        $header_screen_height = $header_data['Screen']['Height'];
        $header_day_week = $header_data['DayWeek'];
        $header_day_hour = $header_data['DayHour'];

        $query_update_navigation = "UPDATE navigation SET
        startup = '$header_startup',
        is_mobile = $header_is_mobile,
        is_embedded = $header_is_embedded,
        screen_width = $header_screen_width,
        screen_height = $header_screen_height,
        day_week = $header_day_week,
        day_hour = $header_day_hour
        WHERE id = $id";
        $db->exec($query_update_navigation);
    }


    function insertActions($db, $navigation_id, $actions)
    {
        $actions_data = $actions;
        foreach ($actions_data as $action) {
            $action_type = $db->escapeString($action['Type']);
            $action_name = $db->escapeString($action['Name']);
            if (!array_key_exists('Value', $action))
                $action['Value'] = null;
            $value = $action['Value'];
            if (is_array($value))
            {
                $value = json_encode($value);
            }
            $action_value = $value !== null ? $db->escapeString($value) : 'NULL';
            $time_ms = (int) $action['TimeMs'];
            $query_insert_action = "INSERT INTO actions (navigation_id, action_type, action_name, action_value, time_ms) VALUES ($navigation_id, '$action_type', '$action_name', '$action_value', $time_ms)";
            $db->exec($query_insert_action);
        }
    }

    function insertOrUpdateSummary($db, $navigation_id, $summary)
    {
        $summary_data = $summary;
        $query_check_summary = "SELECT COUNT(*) FROM summary WHERE navigation_id = $navigation_id";
        $result = $db->querySingle($query_check_summary);

        $columns = ['navigation_id'];
        $values = [$navigation_id];
        $fields = [];

        foreach ($summary_data as $key => $value) {
            if ($key === 'Scope') {
                $flattened_scope = $this->flattenFields($value, 'scope');
                $columns = array_merge($columns, array_keys($flattened_scope));
                $values = array_merge($values, array_values($flattened_scope));
            } elseif ($key === 'Content') {
                $flattened_content = $this->flattenFields($value, 'content');
                $columns = array_merge($columns, array_keys($flattened_content));
                $values = array_merge($values, array_values($flattened_content));
            }
        }

        $fields = array_merge($fields, array_map(function ($col, $val) {
            return "$col = $val";
        }, $columns, $values));

        $set_fields = implode(', ', $fields);
        $columns_str = implode(', ', $columns);
        $values_str = implode(', ', $values);

        if ($result > 0) {
            $query_update_summary = "UPDATE summary SET $set_fields WHERE navigation_id = $navigation_id";
            $db->exec($query_update_summary);
        } else {
            $query_insert_summary = "INSERT INTO summary ($columns_str) VALUES ($values_str)";
            $db->exec($query_insert_summary);
        }
    }

    function flattenFields($data, $prefix = '')
    {
        $fields = [];

        foreach ($data as $key => $value) {
            $field_key = $prefix ? $prefix . '_' . $key : $key;

            if (is_array($value)) {
                $flattened = $this->flattenFields($value, $field_key);
                $fields = array_merge($fields, $flattened);
            } else {
                $escaped_value = $value !== null ? $this->db->escapeString(json_encode($value)) : 'NULL';
                $fields[$field_key] = $escaped_value;
            }
        }

        return $fields;
    }

}