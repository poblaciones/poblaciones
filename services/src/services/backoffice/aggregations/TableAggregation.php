<?php

using System;
using System.Collections.Generic;
using System.Linq;
using medea.common;
using SpssLib.SpssDataset;

namespace medea.entities
{
	public class TableAggregation
	{
		Dataset current;
		public TableAggregation(Dataset current)
		{
			this.current = current;
		}

		public string CreateSqlAggregateTable()
		{
			if (string.IsNullOrEmpty(current.Table))
				throw new Exception("Must set TableName property.");

			string table = current.Table + "_aggregations";

			var sql = "CREATE TABLE " + table + " (id INT NOT NULL AUTO_INCREMENT, " +
						"n INT NOT NULL, geography_item_id INT NOT NULL, geography_id INT NOT NULL,";

			sql = AddCreateSqlAggregateColumns(sql);

			sql += "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

			sql += "ALTER TABLE " + table
				+ " ADD FOREIGN KEY(geography_item_id)"
				+ " REFERENCES geography_item(gei_id);";

			sql += "ALTER TABLE " + table
				+ " ADD FOREIGN KEY(geography_id)"
				+ " REFERENCES geography(geo_id);";

			return sql;
		}

		private string AddCreateSqlAggregateColumns(string sql)
		{
			foreach (var header in current.Columns)
			{
				if (header.Aggregation != AggregationEnum.Ignore)
				{
					// Si es transpose hace uno para cada valor
					if (header.Aggregation == AggregationEnum.Transpose)
					{
						int i = 0;
						foreach (var lbl in header.Labels)
						{
							string nullable = "NULL";
							i++;
							sql += header.Field + "_" + i.ToString() + " INT " + nullable + ",";
						}
					}
					else
					{
						string dataType = FileTable.SpssToMySqlDataType(header.Format, header.FieldWidth);
						string nullable = "NULL";
						sql += header.Field + " " + dataType + " " + nullable + ",";
					}
				}
			}
			return sql;
		}

		public string CreateInsertAggregateTable(int levelId)
		{
			if (string.IsNullOrEmpty(current.Table))
				throw new Exception("Must set TableName property.");
			string table = current.Table + "_aggregations";

			var sql = "INSERT INTO " + table;

			string fields = "n, geography_id, geography_item_id";
			string values = "count(*), " + levelId.ToString();
			string joins;
			List<DatasetColumn> columns = new List<DatasetColumn>();
			CalculateAggregateJoins(levelId, out joins, ref values);

			ComposeAggregateFields(ref fields, ref values, columns);

			string select = "SELECT " + values + " FROM " + current.Table + " " + joins;
			return sql + "(" + fields + ") " + select;
		}

		private void ComposeAggregateFields(ref string fields, ref string values, List<DatasetColumn> columns)
		{
			foreach (var header in current.Columns)
			{
				CreateColumns(header, columns);
				List<string> vals = ComposeAggregateField(ref fields, header);
				foreach (string value in vals)
					values += ", " + value;
			}
		}
		public static void CreateColumns(DatasetColumn header, List<DatasetColumn> columns)
		{
			if (header.Aggregation != AggregationEnum.Ignore)
			{
				string fieldName = header.Variable;
				// Si es transpose hace uno para cada valor
				if (header.Aggregation == AggregationEnum.Transpose)
				{
					int i = 0;
					string subField;
					foreach (var lbl in header.Labels)
					{
						i++;
						subField = fieldName + "_" + i.ToString() + "_sum";

						DatasetColumn newColumn = new DatasetColumn();
						newColumn.Alignment = Alignment.Right;
						newColumn.Variable = fieldName;
						newColumn.Field = GetUniqueField(columns, header.Field);
						if (header.AggregationWeight == null)
						{
							newColumn.Label = header.Label;
							newColumn.Decimals = 0;
							newColumn.FieldWidth = 12;
							newColumn.ColumnWidth = 8;
							newColumn.Format = FormatType.F;
						}
						else
						{
							newColumn.Label += " (Suma de " + header.AggregationWeight.Label + ")";
							newColumn.Decimals = header.AggregationWeight.Decimals;
							newColumn.FieldWidth = 12;
							newColumn.ColumnWidth = 8;
							newColumn.Format = FormatType.F;
						}
						columns.Add(newColumn);
					}
				}
				else
				{
					switch (header.Aggregation)
					{
						case AggregationEnum.Sum:
							fieldName += "_sum";
							break;
						case AggregationEnum.Average:
							fieldName += "_avg";
							break;
						case AggregationEnum.Minimum:
							fieldName += "_min";
							break;
						case AggregationEnum.Maximum:
							fieldName += "_max";
							break;
						default:
							throw new Exception("Invalid aggregation value.");
					}
					DatasetColumn newColumn = new DatasetColumn();
					//newColumn = Serializer.Clone(header);
					newColumn.Variable = fieldName;
					newColumn.Field = GetUniqueField(columns, header.Field);
					columns.Add(newColumn);
				}
			}
		}

		private static string GetUniqueField(List<DatasetColumn> columns, string field)
		{
			throw new NotImplementedException();
		}

		public static List<string> ComposeAggregateField(ref string fields, DatasetColumn header)
		{
			List<string> values = new List<string>();
			if (header.Aggregation == AggregationEnum.Ignore)
				return values;

			// Si es transpose hace uno para cada valor
			if (header.Aggregation == AggregationEnum.Transpose)
			{
				int i = 0;
				foreach (var lbl in header.Labels)
				{
					i++;
					fields += ", " + header.Field + "_" + i.ToString();
					if (header.AggregationWeight == null)
						values.Add("SUM(CASE WHEN " + header.Field + " = " + InsertGenerator.CheapEscape(lbl.Value) +
													" THEN 1 ELSE 0 END)");
					else
						values.Add("SUM(CASE WHEN " + header.Field + " = " + InsertGenerator.CheapEscape(lbl.Value) +
													" THEN " + header.AggregationWeight.Field + " ELSE 0 END)");
				}
			}
			else
			{
				fields += ", " + header.Field;
				switch (header.Aggregation)
				{
					case AggregationEnum.Sum:
						values.Add("SUM(IFNULL(" + header.Field + ", 0))");
						break;
					case AggregationEnum.Average:
						if (header.AggregationWeight == null)
							values.Add("AVG(" + header.Field + ")");
						else
							values.Add("CASE WHEN SUM(IFNULL(" + header.AggregationWeight.Field + ", 0)) = 0 THEN 0 ELSE SUM(IFNULL(" + header.Field + " * " + header.AggregationWeight.Field + ", 0)) / SUM(IFNULL(" + header.AggregationWeight.Field + ", 0)) END");
						break;
					case AggregationEnum.Minimum:
						values.Add("MIN(" + header.Field + ")");
						break;
					case AggregationEnum.Maximum:
						values.Add("MAX(" + header.Field + ")");
						break;
					default:
						throw new Exception("Invalid aggregation value.");
				}
			}
			return values;
		}

		private void CalculateAggregateJoins(int levelId, out string join, ref string values)
		{
			join = "";
			Geography geography = current.Geography;
			string prevParentField = "geography_item_id";
			while (levelId != geography.Id)
			{
				string alias = "c" + geography.Id.ToString();
				string field = alias + ".gei_id";
				string parentField = alias + ".gei_parent_id";
				join += " JOIN geography_item " + alias
										+ " ON " + field + " = " + prevParentField;
				prevParentField = parentField;
				geography = geography.Parent;
			}
			join += " WHERE ommit = 0";
			join += " GROUP BY " + prevParentField;
			values += "," + prevParentField;
		}

		public string DropSqlAggregateTable()
		{
			string table = current.Table + "_aggregations";
			var sql = "DROP TABLE IF EXISTS " + table + ";";
			return sql;
		}
	}
}
