# -*- coding: utf-8 -*-

import os
import sys
import traceback

def main():
	if len(sys.argv) != 3:
		print ('Usage: ' + sys.argv[0] + ' arg1 arg2')
		os._exit(1)

	try:
		print('running ok')
		return

	except:
		print ('Error: ', sys.exc_info())
		traceback.print_exc()
		sys.exit(1)

if __name__ == "__main__":
	main()
