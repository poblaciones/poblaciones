<?php

namespace helena\services\backoffice\metrics;

use minga\framework\Profiling;

/*
 *    Port of 'Javascript Jenks/Fisher breaks by Philipp Schoepf (2015)'
 *    https://raw.githubusercontent.com/pschoepf/naturalbreaks/master/src/main/java/de/pschoepf/naturalbreaks/JenksFisher.java
 *    Original code Jenks/Fisher breaks created in C by Maarten Hilferink.
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

/**
 *
 * Basic port of original C code from Maarten Hilferink.
 * All credits this fantastic work go to him for.
 *
 *
 *
 * @author Philipp Schöpf
 */

class JenksFisher
{
	const VALUES = 0;
	const WEIGHTS = 1;

	private $cumulValues = []; //[[value, weight]]
	private $numValues = 0;
	private $numBreaks = 0;
	private $bufferSize = 0;
	private $previousSSM = []; //double[]
	private $currentSSM = []; //double[]
	private $classBreaks = []; //int[]
	private $classBreaksIndex = 0;
	private $completedRows = 0;


	/**
	 * Main entry point for creation of Jenks-Fisher natural breaks.
	 *
	 * @param array $dataWeighted array of the values
	 * @param int $classes number of breaks to create
	 *
	 * @return array with breaks
	 *
	 */
	public static function Calculate(array $dataWeighted, $classes)
	{
		Profiling::BeginTimer("JenksFisher->Calculate->" . $classes);
		if (count($dataWeighted) < $classes)
		{
			$ret = NtilesBreaks::CreateMinimalList(NtilesBreaks::GetKeys($dataWeighted), $classes);
			Profiling::EndTimer();
			return $ret;
		}
		$breaksArray = self::ClassifyJenksFisherFromValueCountPairs($dataWeighted, $classes);

		$ret = array_values($breaksArray);
		Profiling::EndTimer();
		return $ret;
	}

/**
	 * Constructor that initializes main variables used in fisher calculation of natural breaks.
	 *
	 * @param array $dataWeighted Ordered list of pairs of values to occurrence counts.
	 * @param int $classes Number of breaks to find.
	 */
	private function __construct(array $dataWeighted, $classes)
	{
		$this->cumulValues = [];
		$this->numValues = count($dataWeighted);
		$this->numBreaks = $classes;
		$this->bufferSize = (count($dataWeighted) - ($classes - 1));
		$this->previousSSM = array_fill(0, $this->bufferSize, 0.0);
		$this->currentSSM = array_fill(0, $this->bufferSize, 0.0);
		$this->classBreaks = array_fill(0, $this->bufferSize * ($this->numBreaks - 1), 0);
		$this->classBreaksIndex = 0;
		$this->completedRows = 0;
		$cwv = 0.0;
		$cw = 0;
		$w = 0;

		for ($i = 0; $i != $this->numValues; ++$i)
		{
			$currPair = $dataWeighted[$i];
			$w = $currPair[self::WEIGHTS];
			$cw += $w;
			$cwv += $w * $currPair[self::VALUES];
			$this->cumulValues[] = [$cwv, $cw];
			if ($i < $this->bufferSize)
				$this->previousSSM[$i] = $cwv * $cwv / $cw; // prepare sum of squared means for first class. Last (k-1) values are omitted
		}
	}

	/**
	 * Gets sum of weighs for elements with index b..e.
	 *
	 * @param int $b index of begin element
	 * @param int $e index of end element
	 *
	 * @return int|float sum of weights.
	 *
	 */
	private function GetSumOfWeights($b, $e)
	{
		return $this->GetSumFromWeightedArray($b, $e, self::WEIGHTS);
	}

	/**
	 * Gets sum of weighed values for elements with index b..e
	 *
	 * @param int $b index of begin element
	 * @param int $e index of end element
	 *
	 * @return int|float the cumul. sum of the values*weight
	 *
	 */
	private function GetSumOfWeightedValues($b, $e)
	{
		return $this->GetSumFromWeightedArray($b, $e, self::VALUES);
	}

	/**
	 * Gets sum of x for emements with index b..e
	 *
	 * @param int $b index of begin element
	 * @param int $e index of end element
	 * @param int $i 0 (self::VALUES) for SumOfWeights, 1 (self::WEIGHTS) for SumOfWeightedValues
	 *
	 * @return int|float the cumul. sum of the values*weight
	 */
	private function GetSumFromWeightedArray($b, $e, $i)
	{
		$res = $this->cumulValues[$e][$i];
		$res -= $this->cumulValues[$b - 1][$i];
		return $res;
	}

	/**
	 * Gets the Squared Mean for elements within index b..e, multiplied by weight. Note that
	 * n*mean^2 = sum^2/n when mean := sum/n
	 *
	 * @param int $b index of begin element
	 * @param int $e index of end element
	 *
	 * @return float the sum of squared mean
	 *
	 */
	private function GetSSM($b, $e)
	{
		$res = $this->GetSumOfWeightedValues($b, $e);
		return $res * $res / $this->GetSumOfWeights($b, $e);
	}

	/**
	 * Finds CB[i+completedRows] given that the result is at least
	 * bp+(completedRows-1) and less than ep+(completedRows-1)
	 * Complexity: O(ep-bp) <= O(m) @
	 *
	 * @param int $i startIndex
	 * @param int $bp endindex
	 * @param int $ep
	 *
	 * @return int the index
	 */
	private function FindMaxBreakIndex($i, $bp, $ep)
	{
		$minSSM = $this->previousSSM[$bp] + $this->GetSSM($bp + $this->completedRows, $i + $this->completedRows);
		$foundP = $bp;
		while (++$bp < $ep)
		{
			$currSSM = $this->previousSSM[$bp] + $this->GetSSM($bp + $this->completedRows, $i + $this->completedRows);
			if ($currSSM > $minSSM)
			{
				$minSSM = $currSSM;
				$foundP = $bp;
			}
		}
		$this->currentSSM[$i] = $minSSM;
		return $foundP;
	}

	/**
	 * Find CB[i+completedRows] for all i>=bi and i<ei given that the
	 * results are at least bp+(completedRows-1) and less than
	 * ep+(completedRows-1)
	 * Complexity: O(log(ei-bi)*Max((ei-bi),(ep-bp)))
	 * <= O(m*log(m))
	 *
	 *
	 * @param int $bi
	 * @param int $ei
	 * @param int $bp
	 * @param int $ep
	 *
	 */
	private function CalcRange($bi, $ei, $bp, $ep)
	{
		if ($bi == $ei)
			return;

		$mi = (int)floor(($bi + $ei) / 2);
		$mp = $this->FindMaxBreakIndex($mi, $bp, min($ep, $mi + 1));

		// solve first half of the sub-problems with lower 'half' of possible outcomes
		$this->CalcRange($bi, $mi, $bp, min($mi, $mp + 1));

		$this->classBreaks[$this->classBreaksIndex + $mi] = $mp; // store result for the middle element.

		// solve second half of the sub-problems with upper 'half' of possible outcomes
		$this->CalcRange($mi + 1, $ei, $mp, $ep);
	}

	/**
	 * Swaps the content of the two lists with each other.
	 */
	private function SwapArrays()
	{
		$temp = $this->previousSSM;
		$this->previousSSM = $this->currentSSM;
		$this->currentSSM = $temp;
	}

	/**
	 * Starting point of calculation of breaks.
	 *
	 * complexity: O(m*log(m)*k)
	 */
	private function CalcAll()
	{
		if ($this->numBreaks >= 2)
		{
			$this->classBreaksIndex = 0;
			for ($this->completedRows = 1; $this->completedRows < $this->numBreaks - 1; ++$this->completedRows)
			{
				$this->CalcRange(0, $this->bufferSize, 0, $this->bufferSize); // complexity: O(m*log(m))

				$this->SwapArrays();
				$this->classBreaksIndex += $this->bufferSize;
			}
		}
	}

	/**
	 *  Does the internal processing to actually create the breaks.
	 *
	 * @param int $classes number of breaks
	 * @param array $dataWeighted asc ordered input of values and their occurence counts.
	 */
	private static function ClassifyJenksFisherFromValueCountPairs(array $dataWeighted, $classes)
	{
		$breaksArray = array_fill(0, $classes - 1, 0.0);
		if ($classes == 0)
			return $breaksArray;
		$m = count($dataWeighted);
		$jf = new JenksFisher($dataWeighted, $classes);
		if ($classes > 1)
		{
			// runs the actual calculation
			$jf->CalcAll();
			$lastClassBreakIndex = $jf->FindMaxBreakIndex($jf->bufferSize - 1, 0, $jf->bufferSize);
			while (--$classes != 0)
			{
				// assign the break values to the result
				$breaksArray[$classes - 1]= $dataWeighted[$lastClassBreakIndex + $classes][self::VALUES];
				if ($classes > 1)
				{
					$jf->classBreaksIndex -= $jf->bufferSize;
					$lastClassBreakIndex = $jf->classBreaks[$jf->classBreaksIndex + $lastClassBreakIndex];
				}
			}
		}
		return $breaksArray;
	}

}
