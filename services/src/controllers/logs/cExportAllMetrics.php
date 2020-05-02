<?php

namespace helena\controllers\logs;

use helena\classes\App;
use helena\classes\Menu;
use helena\classes\Paths;
use helena\classes\Session;
use helena\controllers\common\cController;
use minga\framework\Context;
use minga\framework\Date;
use minga\framework\IO;
use minga\framework\Mail;
use minga\framework\Params;
use minga\framework\Str;
use minga\framework\System;

class cExportAllMetrics extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;
		Menu::RegisterAdmin($this->templateValues);

		$sql = "SELECT wrk_id, met_title, mtr_caption, mvr_caption,
						geo_caption,
						(SELECT GROUP_CONCAT(mvv_caption ORDER BY mvv_caption SEPARATOR '\t') FROM variable WHERE mvv_metric_version_level_id = mvl_id)
							as variables
						FROM
						work JOIN metadata ON met_id = wrk_metadata_id JOIN metric_version ON mvr_work_id = wrk_id
						JOIN metric ON mvr_metric_id = mtr_id
						JOIN metric_version_level ON mvl_metric_version_id = mvr_id
						JOIN dataset ON mvl_dataset_id = dat_id
						JOIN geography ON geo_id = dat_geography_id
						WHERE wrk_is_private = 0
						ORDER BY met_title, mtr_caption, mvr_caption, geo_caption";
		$rows = App::Db()->fetchAll($sql);

		echo "<html><body><table border=1>";

			echo "<tr>";
			$this->putCell("Cartografía");
			$this->putCell("Indicador");
			$this->putCell("Versión");
			$this->putCell("Nivel");
			$this->putCell("Variables");
			$this->putCell("Mapa");
			$this->putCell("Metadatos");
			echo "</tr>";

		foreach($rows as $row)
		{
			echo "<tr>";
			$this->putCell($row['met_title']);
			$this->putCell($row['mtr_caption']);
			$this->putCell($row['mvr_caption']);
			$this->putCell($row['geo_caption']);
			$this->putCell(implode("\n", explode("\t", $row['variables'])));
			$this->putCell("https://mapa.poblaciones.org/map/" . $row['wrk_id']);
			$this->putCell("https://mapa.poblaciones.org/map/" . $row['wrk_id'] . "/metadata");
			echo "</tr>";
		}
		echo "</table></body></html>";

		exit;
	}

	function putCell($text)
	{
		echo "<td>" . $this->HtmlEncode($text) . "</td>";
	}

	function HtmlEncode($text, $escape = true)
	{
		if ($escape == false) return $text;
		$text = Str::Replace($text, "&", "&amp;");
		$text = Str::Replace($text, "<", "&lt;");
		$text = Str::Replace($text, ">", "&gt;");
		$text = Str::Replace($text, "\n", "<br/>");
		// rescata las itálicas de citado
		$text = Str::Replace($text, "&lt;i&gt;", "<i>");
		$text = Str::Replace($text, "&lt;/i&gt;", "</i>");
		return $text;
	}

}
