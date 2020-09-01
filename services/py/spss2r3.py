# -*- coding: utf-8 -*-

import os
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import sys
import pandas as pd
import traceback

import sys
import gzip
import shutil

import pyreadr

sys.stdout.reconfigure(encoding='utf-8')


def main():
	if len(sys.argv) != 3:
		print ('Usage: ' + sys.argv[0] + ' spssfile rfile')
		sys.exit(1)

	try:
		df = pd.read_spss(sys.argv[1])
    # , compress="gzip"
		pyreadr.write_rdata(sys.argv[2] + '.tmp', df, df_name="dataset")

		with open(sys.argv[2] + '.tmp', 'rb') as f_in:
			with gzip.open(sys.argv[2], 'wb') as f_out:
					shutil.copyfileobj(f_in, f_out)

		os.remove(sys.argv[2] + '.tmp')
		return

	except:
		print ('Error: ', sys.exc_info())
		traceback.print_exc()
		sys.exit(1)

if __name__ == "__main__":
	main()
