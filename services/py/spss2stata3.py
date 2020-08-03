# -*- coding: utf-8 -*-

import os
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import sys
import pandas as pd
import traceback

from stata3writer import StataWriter117 as statawriter

sys.stdout.reconfigure(encoding='utf-8')

def main():
	if len(sys.argv) != 3:
		print ('Usage: ' + sys.argv[0] + ' spssfile stafile')
		sys.exit(1)

	try:
		df = pd.read_spss(sys.argv[1])

		# Llama al módulo local para evitar BUG de filas vacías
		writer = statawriter(sys.argv[2], df)
		writer.write_file()

		#df.to_stata(sys.argv[2])
		#df.to_stata(sys.argv[2], version=117, convert_strl = df.columns[df.all()].tolist())
		return

	except:
		print ('Error: ', sys.exc_info())
		traceback.print_exc()
		sys.exit(1)

if __name__ == "__main__":
	main()
