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

sys.stdout.reconfigure(encoding='utf-8')

def main():

    MAX_ROWS = 5000
    MAX_DECIMALS = 6
    USE_UTF8 = False

    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print('Usage: ' + sys.argv[0] + ' inputfile [outputpath]')
        sys.exit(1)

    if len(sys.argv) == 2:
        sys.argv.append('')

    try:

        if USE_UTF8:
          encoding = 'UTF-8'
        else:
          encoding = 'unicode_escape'

        with savReaderWriter.SavHeaderReader(sys.argv[1], ioUtf8=USE_UTF8) as header:
            metadata = header.all()

        res = {
            'alignments': metadata.alignments,
            'columnWidths': metadata.columnWidths,
            'measureLevels': metadata.measureLevels,
            'varFormats': metadata.formats,
            'varTypes': metadata.varTypes,
            'varNames': metadata.varNames,
            'valueLabels': metadata.valueLabels,
            'varLabels': metadata.varLabels,
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
            h.write(json.dumps(convert_recursive(res, encoding), indent=4))


        with savReaderWriter.SavReader(sys.argv[1], ioUtf8=USE_UTF8) as reader:
            for i, lines in enumerate(chunks(reader, MAX_ROWS), 1):
                with open(os.path.join(sys.argv[2], 'data_' + str(i).zfill(5) + '.json'), 'w') as f:
                    encoded = convert_recursive(lines, encoding)
                    jsonText = json.dumps(encoded)
                    # jsonText = truncate_decimals(jsonText, MAX_DECIMALS)
                    f.write(jsonText)

        print('Files successfully created.')

        return

    except:
        print("Error: ", sys.exc_info())
        traceback.print_exc()
        sys.exit(1)


def chunks(lst, n):
    ''' Yield successive n-sized chunks from lst.
    '''
    for i in range(0, len(lst), n):
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

def convert_recursive(input, enc='unicode_escape'):
    ''' Convierte recursivamente el encoding de un diccionario o un array.
    '''
    if isinstance(input, dict):
        return {convert_recursive(key): convert_recursive(value, enc) for key, value in input.items()}
    elif isinstance(input, list):
        return [convert_recursive(element, enc) for element in input]
    elif isinstance(input, bytes):
        return input.decode(enc).rstrip('\xa0')
    else:
        return input

if __name__ == "__main__":
    main()

