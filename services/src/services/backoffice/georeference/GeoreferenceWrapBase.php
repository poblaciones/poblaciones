<?php

namespace helena\services\backoffice\georeference;

use minga\framework\Profiling;

class GeoreferenceWrapBase extends GeoreferenceBase
{
	protected $wrapped;

	public function __construct($wrapped)
	{
		$this->wrapped = $wrapped;
	}

	protected function setStartFields()
	{
		$this->setFields('start', 'geography_item_id');
	}
	protected function setEndFields()
	{
		$this->setFields('end', 'geography_item_segment_id');
	}
	protected function setFields($preffix, $updateColumn)
	{
		$value = $this->wrapped->state->Get($preffix . 'Code');
		$this->wrapped->state->Set('code', $value);
		$value = $this->wrapped->state->Get($preffix . 'GeographyId');
		$this->wrapped->state->Set('geographyId', $value);

		$value = $this->wrapped->state->Get($preffix . 'Lat');
		$this->wrapped->state->Set('lat', $value);
		$value = $this->wrapped->state->Get($preffix . 'Lon');
		$this->wrapped->state->Set('lon', $value);

		$this->wrapped->state->Set('updateColumn', $updateColumn);
	}
	public function CountRows()
	{
		return $this->wrapped->CountRows();
	}
}

