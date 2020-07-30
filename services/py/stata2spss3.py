# -*- coding: utf-8 -*-

import os
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import sys
import pandas as pd
import traceback
import pyreadstat

def main():
	if len(sys.argv) != 3:
		print ('Usage: ' + sys.argv[0] + ' stafile spssfile')
		sys.exit(1)

	try:
		df = pd.read_stata(sys.argv[1])
		pyreadstat.write_sav(df, sys.argv[2])
		return

	except:
		print ('Error: ', sys.exc_info())
		traceback.print_exc()
		sys.exit(1)

if __name__ == "__main__":
	main()
