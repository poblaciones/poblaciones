# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup
from zipfile import ZipFile
from distutils.util import strtobool
from shutil import rmtree
from pathlib import Path

import re
import html.entities as htmlentitydefs
import traceback
import unicodecsv as csv
import os
import sys
import re
import io
from string import capwords

# dependencies: bs4 lxml unicodecsv
# pip install bs4 lxml unicodecsv
# Usage: python kmx2csv.py [kmz|kml] in_file out_path [true|false] [all|folder_name]


def main():
		if len(sys.argv) < 4 or len(sys.argv) > 6:
				print(
						f'Usage: {sys.argv[0]} file_extension in_file out_path [generate_files] [folder_name]')
				os._exit(1)
		if len(sys.argv) == 4:
				sys.argv.append('true')
		if len(sys.argv) == 5:
				sys.argv.append('all')
		#print(f'Args: {sys.argv[0]} - {sys.argv[1]} - {sys.argv[2]} - {sys.argv[3]} - {sys.argv[4]} - {sys.argv[5]}')
		try:
				file_extension = sys.argv[1]
				in_file = sys.argv[2]
				out_folder = sys.argv[3]
				generate_files = bool(strtobool(sys.argv[4]))
				folder_name = sys.argv[5]
				converter = Converter(in_file, out_folder)

				if generate_files == True:
					out_file = in_file + '_out.csv'
					if file_extension == 'kml':
						files_list = converter.process_kml(in_file, out_file, folder_name)
					elif file_extension == 'kmz':
						files_list = converter.process_kmz(out_file, folder_name)
				else:
					files_list = []
					if file_extension == 'kml':
						files_list = converter.parse_folder_names(in_file)
					elif file_extension == 'kmz':
						files_list = converter.parse_folder_names_kmz()
					list_file = in_file + '_folders.txt'
					with io.open(list_file, 'w', encoding='utf8') as filelist_file:
						filelist_file.write('\n'.join(files_list))

				return

		except:
				print('Error: ', sys.exc_info())
				traceback.print_exc()
				sys.exit(1)

class Converter:
	def __init__(self, in_file, out_folder):
			self.hasAltitude = False
			self.hasLatLong = False
			self.hasName = False
			self.hasAddress = False
			self.hasGeoJson = False
			self.extraColumns = []
			self.out_folder = out_folder
			self.in_file = in_file

	def extract_kmz(self):
			''' Extrae todos los KML de un KMZ y los procesa a todos en un directorio temporal '''
			# Descomprimo el KMZ
			kmz_path = os.path.join(self.out_folder, 'kmz_zip')
			kmz = ZipFile(self.in_file, 'r')
			kmz.extractall(kmz_path)
			files_kml = []
			for _, _, files in os.walk(kmz_path):
					for _, a_file in enumerate(files):
							_, extension = os.path.splitext(a_file)
							if extension == '.kml':
									files_kml.append(os.path.join(kmz_path, a_file))
			return files_kml

	def parse_folder_names_kmz(self):
		files = self.extract_kmz();
		for file in files:
			files_kmz = self.parse_folder_names(file)
		return files_kmz

	def parse_folder_names(self, file_kml):
		files_kml = []
		doc = self.read_file_as_document(file_kml)
		for folder in doc.get_folders():
			a_folder_name = folder.get_name()
			files_kml.append(a_folder_name)
		return files_kml

	def process_kmz(self, out_file, folder_name):
		files = self.extract_kmz();
		for file in files:
			 self.process_kml(file, out_file, folder_name)
		return

	def process_kml(self, file_kml, out_file, folder_name):
		doc = self.read_file_as_document(file_kml)
		folder = doc.get_folder_by_name(folder_name)
		self.parseExtraColumns(folder);

		with open(out_file, 'wb') as acsvfile:
					awriter = csv.writer(acsvfile, delimiter=',', quotechar='"', doublequote=True, skipinitialspace=False, lineterminator='\n',
																quoting=csv.QUOTE_ALL)
					awriter.writerow(self.createTitle())
					for placemark in folder.get_placemarks():
							for place in placemark.get_places():
									row = self.createRow(placemark, place)
									awriter.writerow(row)
		return

	def parseExtraColumns(self, folder):
		extraColumns = []
		for placemark in folder.get_placemarks():
			for element in placemark.get_extended_data_keys():
				name = placemark.get_name()
				if not name is None and name != '':
					self.hasName = True
				if not element in extraColumns:
					extraColumns.append(element)
					for place in placemark.get_places():
						data = place.get_row()
						if not data[2] is None and data[2] != '' and data[2] != 0 and data[2] != "0":
							self.hasAltitude = True
						if (not data[0] is None and data[0] != '') or (not data[1] is None and data[1] != ''):
							self.hasLatLong = True
						if not isinstance(place, Point) and not isinstance(place, Address):
							self.hasGeoJson = True
						if isinstance(place, Address):
							self.hasAddress = True

		self.extraColumns = extraColumns
		return

	def read_file_as_document(self, in_file):
		with io.open(in_file, 'r', encoding='utf8') as kml_file:
			kml_file_content = kml_file.read().replace('’', "'").replace('“', "'").replace('”', "'").replace('<br><br>', '<br>').replace(
					'<br>', ' /// ').replace('descripción: ', 'Descripción: ').replace('nombre: ', 'Nombre: ')
			kml_as_xml = BeautifulSoup(kml_file_content, 'xml')
			doc = Document(kml_as_xml)
		return doc

	def createTitle(self):
		title = []

		if self.hasName:
			title.append('Nombre')

		for extraColumn in self.extraColumns:
			title.append(extraColumn)
		if self.hasAddress:
			title.append('Dirección')
		if self.hasLatLong:
			title.extend(['Latitud', 'Longitud'])
		if self.hasAltitude:
			title.append('Altitud')
		if self.hasGeoJson:
			title.append('GeoJSON')

		title.append('Estilo')
		title.append('Descripción')

		return title

	def createRow(self, placemark, place):
			row = []

			if self.hasName:
				row.append(self.formatLine(placemark.get_name()))

			for extraColumn in self.extraColumns:
				row.append(self.formatLine(placemark.get_extended_data_element(extraColumn)))

			# geo data
			placeData = place.get_row()  # 4 elementos: x,y,z,GeoJson

			if self.hasAddress:
				if isinstance(place, Address):
					row.append(place.get_description())
				else:
					row.append('')

			# Lat, long
			if self.hasLatLong:
				row.extend([placeData[1], placeData[0]])
			if self.hasAltitude:
				row.append(placeData[2])
			# GeoJson
			if self.hasGeoJson:
				row.append(placeData[3])

			row.append(self.formatLine(placemark.get_styleUrl()))

			row.append(self.formatLine(placemark.get_description()))

			return row

	def formatLine(self, line):
			# return line
			if line == None:
					return ''
			return self.unescape(line.strip().replace("\n", " "))

#podria pasar &#205; a utf

##
# Removes HTML or XML character references and entities from a text string.
#
# @param text The HTML (or XML) source text.
# @return The plain text, as a Unicode string, if necessary.

	def unescape(self, text):
		def fixup(m):
				text = m.group(0)
				if text[:2] == "&#":
						# character reference
						try:
								if text[:3] == "&#x":
										return chr(int(text[3:-1], 16))
								else:
										return chr(int(text[2:-1]))
						except (ValueError, OverflowError):
								pass
				else:
						# named entity
						try:
								text = chr(htmlentitydefs.name2codepoint[text[1:-1]])
						except KeyError:
								pass
				return text # leave as is
		return re.sub("&#?\w+;", fixup, text)


class Document:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.folders = []
				self.__parse__(xml)
				self.xml = xml

		def __parse__(self, xml):
				for folder in xml.find_all('Folder'):
						self.folders.append(Folder(folder))

		def get_folders(self):
				return self.folders

		def get_folder_by_name(self, folder_name):
			for folder in self.get_folders():
				a_folder_name = folder.get_name()
				if folder_name == a_folder_name:
					return folder
			if folder_name == 'false':
				return Folder(self.xml)
			else:
				raise Exception("Dataset no encontrado")

class Folder:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.placemarks = []
				self.__parse__(xml)

		def __parse__(self, xml):
				self.description = xml.find('description')
				self.name = xml.find('name')
				for placemark in xml.find_all('Placemark'):
						self.placemarks.append(Placemark(placemark))

		def get_name(self):
				return self.name.string if self.name else ''

		def get_description(self):
				return self.description.string if self.description else ''

		def get_placemarks(self):
				return self.placemarks


class Placemark:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.places = []
				self.extended_data = ''
				self.extended_data_obj = None
				self.__parse__(xml)

		def __parse__(self, xml):
				self.name = xml.find('name')
				self.description = xml.find('description')
				self.styleUrl = xml.find('styleUrl')
				point = xml.find('Point')
				if not point is None:
					self.places.append(Point(point))
				else:
					polygon = xml.find('Polygon')
					if not polygon is None:
						self.places.append(Polygon(polygon))
					else:
						linestring = xml.find('LineString')
						if not linestring is None:
							self.places.append(LineString(linestring))
						else:
							multigeometry = xml.find('MultiGeometry')
							if not multigeometry is None:
								# faltaría implementar MultiGeometry
								raise Exception("Multigeometry no soportado")
							else:
								address = xml.find('address')
								if not address is None:
									self.places.append(Address(address))
								else:
									raise Exception("Tipo de geometría no soportado")
				ext_data = xml.find('ExtendedData')
				self.extended_data_obj = ExtendedData(ext_data)
				self.extended_data = self.extended_data_obj.get_data() if ext_data else ''

		def get_places(self):
				return self.places

		def get_name(self):
				return self.name.string if self.name else ''

		def get_description(self):
				return self.description.string if self.description else ''

		def get_styleUrl(self):
				return self.styleUrl.string if self.styleUrl else ''

		def get_extended_data(self):
				return self.extended_data

		def get_extended_data_element(self, key):
				return self.extended_data_obj.get_data_element(key)

		def get_extended_data_keys(self):
				return self.extended_data_obj.get_data_keys()


class Point:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.coordinates = []
				self.__parse__(xml)

		def __parse__(self, xml):
				for coordinate in xml.find_all('coordinates'):
						for coord_str in coordinate:
								self.coordinates.append(Coordinate(coord_str))

		def get_row(self):
				row = self.coordinates[0].get_xyz_row()
				row.append(self.__get_geodata())
				return row

		def get_name(self):
				return self.name.string if self.name else ''

		def get_description(self):
				return self.description.string if self.description else ''

		def __get_geodata(self):
				coords = []
				for coord in self.coordinates:
						coords.append(coord.get_xyz_row())
				return {
						'type': 'Point',
						'coordinates': [coords]
				}


class Address:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.coordinates = []
				self.__parse__(xml)

		def __parse__(self, xml):
				self.description = xml
				if (self.has_coordinate_chars(self.description.text.strip())):
					coord_text = xml.text.strip()
					coord_text = re.sub(r'\s+', ' ', coord_text)
					xy = coord_text.split(' ')
					coord_str = xy[1] + ',' + xy[0] + ',0'
					self.coordinates.append(Coordinate(coord_str))

		def has_coordinate_chars(self, cad):
			valid = '0123456789-, '
			return 0 not in [c in valid for c in cad]

		def get_row(self):
			if len(self.coordinates) == 0:
				row = ['', '', '']
			else:
				row = self.coordinates[0].get_xyz_row()
			row.append(self.__get_geodata())
			return row

		def __get_geodata(self):
				return None

		def get_name(self):
				return self.name.string if self.name else ''

		def get_description(self):
				return self.description.string if self.description else ''


class Polygon:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.rings = []
				self.__parse__(xml)

		def __parse__(self, xml):
				for coordinate in xml.find_all('coordinates'):
						coordinates = []
						for coord_strs in coordinate:
								coord_str = coord_strs.split(' ')
								for string_with_coordinate in coord_str:
										string_with_coordinate = string_with_coordinate.strip('\n')
										if string_with_coordinate != '':
												coordinates.append(
														Coordinate(string_with_coordinate))
						self.rings.append(coordinates)

		def get_row(self):
				row = ['', '', '']
				row.append(self.__get_geodata())
				return row

		def get_rings(self):
				return self.rings

		def __get_geodata(self):
				coords = []
				for ring in self.rings:
					ringCoords = []
					for coord in ring:
							ringCoords.append(coord.get_xy_row_float())
					coords.append(ringCoords)
				m = {
						'type': 'Polygon',
						'coordinates': coords
				}
				return str(m).replace("'", '"')

		def get_name(self):
				return self.name.string if self.name else ''

		def get_description(self):
				return self.description.string if self.description else ''

class LineString:
		def __init__(self, xml):
				self.name = ''
				self.description = ''
				self.coordinates = []
				self.__parse__(xml)

		def __parse__(self, xml):
				for coordinate in xml.find_all('coordinates'):
						for coord_strs in coordinate:
								coord_str = coord_strs.split(' ')
								for string_with_coordinate in coord_str:
										string_with_coordinate = string_with_coordinate.strip('\n')
										if string_with_coordinate != '':
												self.coordinates.append(
														Coordinate(string_with_coordinate))

		def get_row(self):
				row = ['', '', '']
				row.append(self.__get_geodata())
				return row

		def get_coordinates(self):
				return self.coordinates

		def __get_geodata(self):
				coords = []
				for coord in self.coordinates:
						coords.append(coord.get_xy_row_float())
				m = {
						'type': 'LineString',
						'coordinates': coords
				}
				return str(m).replace("'", '"')

		def get_name(self):
				return self.name.string if self.name else ''

		def get_description(self):
				return self.description.string if self.description else ''

class Coordinate:
		def __init__(self, coord_str):
				try:
						xyz = coord_str.strip().split(',')
						self.x = xyz[0].replace(',', '.')
						self.y = xyz[1].replace(',', '.')
						self.z = xyz[2].replace(',', '.')
				except:
						xyz = coord_str.strip().split(',')
						self.x = xyz[0].replace(',', '.')
						self.y = xyz[1].replace(',', '.')
						self.z = 0

		def get_xyz_row(self):
				return [self.x, self.y, self.z]

		def get_xy_row(self):
				return [self.x, self.y]

		def get_xy_row_float(self):
				return [float(self.x), float(self.y)]


class ExtendedData:
		def __init__(self, xml):
				self.data = {}
				self.__parse__(xml)

		def __parse__(self, xml):
				for adata in xml.find_all('SchemaData'):
						for data in adata.find_all('SimpleData'):
								if (data['name'] != None and data.string != None):
										self.data[data['name']] = data.string
				for data in xml.find_all('Data'):
						data_value = data.find('value').contents
						if len(data_value) != 0:
								data_value = data_value[0]
								data_value = data_value.replace('\n', '')
								data_value = re.sub(r'\\x..', '', data_value) # data_value.replace('\xa0', ' ')
								self.data[data['name']] = data_value

		def get_data(self):
				extData = ''
				for key in self.data:
						extData = extData + capwords(key) + \
								': ' + self.data[key] + ' /// '
				return extData

		def get_data_element(self, element):
				if element in self.data:
					return self.data[element]
				else:
					return ''

		def get_data_keys(self):
				return self.data.keys()

		def get_row(self):
				extData = ''
				for key in self.data:
						extData = extData + capwords(key) + \
								': ' + self.data[key] + ' /// '
				return extData


if __name__ == '__main__':
		main()
