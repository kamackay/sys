using System;
using System.Diagnostics;
using System.IO;
using static sys.Global;

namespace tools {
  class Program {
    static void Main(string[] args) {
      DateTime startTime = DateTime.Now;
      log("--------------------------------------------------");
      if (args.Length == 0) {
        log("Please pass a parameter");
        goto end;
      }
      try {
        string method = args[0];
        Func<string, string, string> getArg = delegate (string name, string defaultVal) {
          foreach (string arg in args) {
            try {
              string[] temp = arg.Split('=');
              if (temp[0].ToLower().Equals(name)) return temp[1];
            } catch { }
          }
          return defaultVal;
        };
        switch (method.ToLower()) {
          case "filesize":
            string path = getArg("path", null);
            bool verbose = getArg("log", "false").Equals("true");
            if (verbose) log("Verbose on");
            if (!string.IsNullOrEmpty(path) && (Directory.Exists(path) || File.Exists(path))) {
              ulong size = 0;
              log(string.Format("Calculate the size of \"{0}\"", path));
              size = getFolderSize(path, verbose);
              FileSize fs = FileSize.calculate(size);
              log(string.Format("\t{0:N6} {1} -- {2} bytes", fs.size, FileSize.getUnitName(fs.unit), size));
            } else {
              log("Please provide a valid path");
            }
            break;
        }
      } catch (Exception e) {
        log(e.Message);
      }
      end:
      TimeSpan processTime = DateTime.Now - startTime;
      log(string.Format("\nProcessed in {0} seconds", processTime.TotalSeconds));
    }

    private static Action<string> log = delegate (string s) {
      foreach (string line in s.splitToLines()) {
        string finLine = string.Format("{0}: {1}", Time.timestamp(), line);
        Debug.WriteLine(line);
        Console.WriteLine(line);
        toFile(logFilename, finLine);
      }
    };

    static string logFilename = Path.Combine(getExePath(), "sys.log");

    private static ulong getFolderSize(string path, bool verbose = false) {
      if (verbose) log("\t -- " + path);
      ulong size = 0;
      try {
        if (File.Exists(path)) return (ulong)new FileInfo(path).Length;
        foreach (string subPath in Directory.EnumerateFileSystemEntries(path, "*", SearchOption.TopDirectoryOnly)) {
          try {
            if (File.Exists(subPath)) {
              ulong s = (ulong)new FileInfo(subPath).Length;
              size += s;
              if (verbose) log(string.Format("\t\t{0} bytes: {1}", s, subPath));
            } else if (Directory.Exists(subPath)) size += getFolderSize(subPath, verbose);
          } catch { }
        }
      } catch { }
      return size;
    }
  }
}
