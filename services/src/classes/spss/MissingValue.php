<?php
namespace helena\classes\spss;

// The kind of custom missing values for a variable
class MissingValue
{
	// No custom missing values for the variable
	const NoMissingValues = 0;
	// One speciffic custom missing value. The missing value should be specified on the fist item on missingValues[]
	const OneDiscreteMissingValue = 1;
	// Two speciffic custom missing values. The missing values should be specified on the fist and second items on missingValues[]
	const TwoDiscreteMissingValue = 2;
	// Two speciffic custom missing values. The missing values should be specified on the fist, second and third items on missingValues[]
	const ThreeDiscreteMissingValue = 3;
	// Defines a range to be treated as missing values, from the first item in the on missingValues[] to the second value, inclusively.
	const Range = -2;
	// Identical to Range, but with an additional discrete value specified on the third item of missingValues[]
	const RangeAndDiscrete = -3;

}
