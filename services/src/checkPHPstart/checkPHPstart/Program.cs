using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace checkPHPstart
{
	class Program
	{
		static void Main(string[] args)
		{
			var dir = Directory.GetCurrentDirectory();
			dir = Path.GetDirectoryName(dir);
			dir = Path.GetDirectoryName(dir);
			dir = Path.GetDirectoryName(dir);
			dir = Path.GetDirectoryName(dir);

			Console.WriteLine("STARTED IN DIR: " + dir);
			recurse(dir);
			Console.WriteLine("Done!");
			Console.ReadLine();
		}

		private static void recurse(string v)
		{
			foreach(var f in Directory.GetFiles(v, "*.php"))
			{
				check(f);
			}
			foreach(var d in Directory.GetDirectories(v))
			{
				recurse(d);
			}

		}

		private static void check(string f)
		{
		
			string text = File.ReadAllText(f);
			if (!text.StartsWith("<?php"))
				Console.WriteLine(f);
		
		}
	}
}
