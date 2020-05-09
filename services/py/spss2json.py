# -*- coding: utf-8 -*-

import os
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import savReaderWriter
import traceback
import json
import sys
import re

def main():

    MAX_ROWS = 5000
    MAX_DECIMALS = 6

    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print ('Usage: ' + sys.argv[0] + ' inputfile [outputpath]')
        os._exit(1)

    if len(sys.argv) == 2:
        sys.argv.append('')

    try:
        with savReaderWriter.SavHeaderReader(sys.argv[1], ioUtf8=False) as header:
            metadata = header.all()

        res = {
            'alignments': metadata.alignments,
            'columnWidths': metadata.columnWidths,
            'measureLevels': metadata.measureLevels,
            'varFormats': metadata.formats,
            'varTypes': metadata.varTypes,
            'varNames': metadata.varNames,
            'valueLabels': convert_recursive(metadata.valueLabels),
            'varLabels': convert_recursive(metadata.varLabels),
            # # Otros valores que vienen en el header:
            # 'caseWeightVar': metadata.caseWeightVar,
            # 'fileAttributes': metadata.fileAttributes,
            # 'fileLabel': metadata.fileLabel,
            # 'missingValues': metadata.missingValues,
            # 'multRespDefs': metadata.multRespDefs,
            # 'varAttributes': metadata.varAttributes,
            # 'varRoles': metadata.varRoles,
            # 'varSets': metadata.varSets,
        }

        with open(os.path.join(sys.argv[2], 'header.json'), 'w') as h:
            h.write(json.dumps(res, indent=4, encoding='latin1'))

        with savReaderWriter.SavReader(sys.argv[1], ioUtf8=False) as reader:
            for i, lines in enumerate(chunks(reader, MAX_ROWS), 1):
                with open(os.path.join(sys.argv[2], 'data_' + str(i).zfill(5) + '.json'), 'w') as f:
                    encoded = convert_recursive(lines)
                    jsonText = json.dumps(encoded)
					# jsonText = truncate_decimals(jsonText, MAX_DECIMALS)
                    f.write(jsonText)

        print ('Files successfully created.')

        os._exit(0)

    except:
        print ("Error: ", sys.exc_info())
        traceback.print_exc()
        os._exit(1)


def chunks(lst, n):
    ''' Yield successive n-sized chunks from lst.
    '''
    for i in xrange(0, len(lst), n):
        yield lst[i:i + n]

def truncate_decimals(text, ndigits):
    ''' Trunca decimales a ndigits en números de un string de json.
    '''
    # \. = caracter de punto (.)
    # \d = dígito de 0 a 9
    #    {n} = cantidad de ocurrencias n
    # \d* = digitos cantidad de ocurrencias mayor igual a cero
    # [ ,\)] = alguno de los caracteres entre corchetes: espacio, coma o cierra paréntesis
    # Entre paréntesis los grupos para el replace $1, $2 (se borra), $3
    return re.sub(r'(\.\d{' + str(ndigits) + r'})(\d*)([ ,\)\]])', r'\1\3', text)

def convert_recursive(input, source='cp1252', dest='utf-8'):
    ''' Convierte recursivamente el encoding de un diccionario o un array.
    '''
    if isinstance(input, dict):
        return {key: convert_recursive(value, source, dest) for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [convert_recursive(element, source, dest) for element in input]
    elif isinstance(input, basestring):
        return input.decode(source).encode(dest)
    else:
        return input

if __name__ == "__main__":
    main()

