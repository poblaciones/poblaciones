# -*- coding: utf-8 -*-

import savReaderWriter
import traceback
import ijson
import json
import glob
import sys
import os

def main():
  if len(sys.argv) != 4:
    print 'Usage: ' + sys.argv[0] + ' headfile datafile outputfile'
    os._exit(1)

  try:
    with open(sys.argv[1]) as head_file:
        head = json.load(head_file)

    head['valueLabels'] = int_keys(head['valueLabels'], head['varTypes'])
    data_path = replace_last(sys.argv[2], '.json', '_*.json')

    with savReaderWriter.SavWriter(sys.argv[3], head['varNames'], head['varTypes'],
      head['valueLabels'], head['varLabels'], head['varFormats'], None, head['measureLevels'],
      head['columnWidths'], head['alignments'], ioUtf8=True) as writer:

      for f in sorted(glob.glob(data_path)):
        with open(f) as data_file:
          for record in ijson.items(data_file, 'item'):
            writer.writerow(record)


      os.remove(sys.argv[1])
      os.remove(sys.argv[2])
      for f in glob.glob(data_path):
        os.remove(f)

      print 'File ' + sys.argv[3] + ' successfully created.'
  except:
      print 'Error: ', sys.exc_info()
      traceback.print_exc()
      os._exit(1)

def replace_last(s, old, new, occurrence=1):
  ''' Reemplaza la(s) última(s) ocurrencia(s) de un string.
  '''
  li = s.rsplit(old, occurrence)
  return new.join(li)

def int_keys(values, types):
	''' Convierte a int keys de labels en variables numéricas.
	'''
	ret = {}
	for key, value in values.items():
		ret[key] = {}
		for k, v in value.items():
			if k.startswith('_'):
				kValue = k[1:]
			else:
				kValue = k
			if types[key] == 0:
					if kValue.encode('ascii').find(".") == -1:
							ret[key][int(kValue)] = v
					else:
							ret[key][float(kValue)] = v
			else:
					ret[key][kValue] = v
	return ret

if __name__ == "__main__":
    main()

