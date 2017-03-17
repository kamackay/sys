// tools.cpp : Defines the entry point for the console application.
//

#define _CRT_SECURE_NO_WARNINGS
#include "stdafx.h"
#include "tools.h"
#include <fstream>
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <windows.h>
#include <iterator>
#include <algorithm>
#include <tchar.h>
#include <signal.h>
#include <psapi.h>
#include <filesystem>
#include <regex>

#define REGEX_ALL ".*"
#define TRUE_STR "true"
#define FALSE_STR "false"
#define EMPTY_STRING ""

using namespace std;
using namespace std::tr2::sys;

void print(const char* input, int indent, bool newLine) {
  StringBuilder* sb = new StringBuilder();
  for (int i = 0; i < indent; i++) sb->append("    ");
  sb->append(input);
  //sb->append("\n");
  ofstream fs("tools.out.log", fstream::out | fstream::app);
  const string _str = sb->str();
  fs << _str.c_str();
  if (newLine) fs << endl;
  fs.close();
  cout << _str.c_str();
  if (newLine) cout << endl;
}

void print(const string input, int indent, bool newLine) {
  print(input.c_str(), indent, newLine);
}

void printHelp() {
  print("The \"method\" is the first parameter after tools.exe\n");
  print("Methods:");

  print("- filesize:", 1);
  print("- path=<PathName>", 2);
  print("- log=<true or false> (Default false)", 2);

  print("- find (or find2, which does the same thing, but may not be faster)", 1);
  print("- path=<PathName>", 2);
  print("- match=<Regex to search for>", 2);
  print("- filesOnly=<true or false> (Default false)", 2);
  //print("- log=<true or false> (Default true)", 2);
}

StringBuilder & StringBuilder::append(const string & str) {
  scratch.append(str);
  if (scratch.size() > ScratchSize) {
    main.append(scratch);
    scratch.resize(0);
  }
  return *this;
}

const string & StringBuilder::str() {
  if (scratch.size() > 0) {
    main.append(scratch);
    scratch.resize(0);
  }
  return main;
}

template<typename Out>
void split(const string &s, char delim, Out result) {
  stringstream ss;
  ss.str(s);
  string item;
  while (getline(ss, item, delim)) {
    *(result++) = item;
  }
}


vector<string> split(const string &s, char delim) {
  vector<string> elems;
  split(s, delim, back_inserter(elems));
  return elems;
}

string getArg(int argc, char *argv[], string name, string defaultValue) {
  for (int i = 0; i < argc; i++) {
    string s(argv[i]);
    vector<string> parts = split(s, '=');
    if (parts.size() < 2) continue;
    if (name.compare(parts[0]) == 0) return parts[1];
  }
  return defaultValue;
}

bool getBoolArg(int argc, char *argv[], std::string name, bool defaultVal) {
  const string compareVal = defaultVal ? FALSE_STR : TRUE_STR;
  string strVal = toLower(getArg(argc, argv, name, EMPTY_STRING));
  if (strVal.compare(EMPTY_STRING) == 0) return defaultVal;
  return compareVal.compare(strVal) == 0;
}

int getIntArg(int argc, char *argv[], std::string name, int defaultVal) {
  try {
    char* intStr = new char[5 + (int)log10(defaultVal)];
    sprintf(intStr, "%d", defaultVal);
    string strVal = getArg(argc, argv, name, intStr);
    return stoi(strVal);
  }
  catch (exception&) {}
  return defaultVal;
}

long getFileSize(string filename) {
  struct stat stat_buf;
  int rc = stat(filename.c_str(), &stat_buf);
  return rc == 0 ? stat_buf.st_size : -1;
}

// Get the size of a folder in bytes. The value is stored into the f_size value, and assumes that the value passed in initially is 0
void getFolderSize(string rootFolder, unsigned long long &f_size, bool log, int logIndent, int depth) {
  if (log) print(rootFolder, logIndent + depth);
  try {
    path folderPath(rootFolder);
    if (exists(folderPath)) {
      // Another way to do this
      /**/
      directory_iterator end_itr;
      for (directory_iterator dirIte(rootFolder); dirIte != end_itr; ++dirIte) {
        if (is_directory(dirIte->status())) {
          string subPathString = dirIte->path().string();
          getFolderSize(subPathString, f_size, log, logIndent, depth + 1);
        }
        else {
          string subPath_str = dirIte->path().string();
          if (log) print(subPath_str, logIndent + depth + 1);
          path subPath(subPath_str);
          f_size += file_size(subPath);
        }
      }/**/
      /**recursive_directory_iterator end_itr;
      for (recursive_directory_iterator dirIte(rootFolder); dirIte != end_itr; ++dirIte) {
        if (!is_directory(dirIte->status())) {
          string subPath_str = dirIte->path().string();
          if (log) print(subPath_str, logIndent + depth + 1);
          f_size += getFileSize(subPath_str);
        }
      }/**/
    }
  }
  catch (exception&) {}
}

string toLower(string in) {
  transform(in.begin(), in.end(), in.begin(), ::tolower);
  return in;
}

FileSize::FileSize(unsigned long long size) {
  unit = 0;
  this->size = (long double)size;
}

void FileSize::incUnit() {
  if (size > 1024) {
    unit++;
    size /= 1024;
  }
}

FileSize FileSize::convertByteCount(unsigned long long bytes) {
  FileSize fs(bytes);
  while (fs.size >= 1024) fs.incUnit();
  return fs;
}

string FileSize::getUnitName(unsigned short unit) {
  string* names = new string[7]{ "bytes", "KB", "MB", "GB", "TB", "PB", "ZB" };
  try { return names[unit]; }
  catch (exception&) {}
  return names[0];
}

vector<string> getAllFiles(string rootPath) {
  return getAllFileSystemEntries(rootPath, true);
}

vector<string> getAllFileSystemEntries(string rootPath, bool filesOnly) {
  vector<string> paths;
  try {
    path folderPath(rootPath);
    if (exists(folderPath)) {
      recursive_directory_iterator end_itr;
      for (recursive_directory_iterator dirIte(rootPath); dirIte != end_itr; ++dirIte) {
        if (!filesOnly || is_directory(dirIte->status()))
          paths.push_back(dirIte->path().string());
      }
    }
  }
  catch (exception&) {}
  return paths;
}

ProcessInfo::ProcessInfo(int pid, string name) {
  this->pid = pid;
  this->name = name;
}

void _findMatch(string rootPath, string expression) {
  regex regular_expression(expression.c_str());
  print("Scanning all files and folders:\n", 1);
  vector<string> paths = getAllFileSystemEntries(rootPath);
  for (string path : paths) {
    if (regex_match(path, regular_expression)) {
      print(path, 1);
    }
  }
}

void findMatch(string rootPath, string expression, bool filesOnly) {
  print(filesOnly ? "Files Only On" : "Files Only Off", 1);
  regex regular_expression(expression.c_str());
  print("Scanning all files and folders:\n", 1);
  path folderPath(rootPath);
  if (exists(folderPath)) {
    recursive_directory_iterator end_itr;
    for (recursive_directory_iterator dirIte(rootPath); dirIte != end_itr; ++dirIte) {
      string path = dirIte->path().string();
      if (regex_match(path, regular_expression) && (!filesOnly || is_directory(dirIte->status())))
        print(path, 1);
    }
  }
}

ProcessInfo getProcessInfo(unsigned long processID) {
  ProcessInfo info(processID, "<unknown>");
  TCHAR szProcessName[MAX_PATH] = TEXT("<unknown>");
  HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processID);

  if (NULL != hProcess) {
    HMODULE hMod;
    DWORD cbNeeded;

    if (EnumProcessModules(hProcess, &hMod, sizeof(hMod), &cbNeeded)) {
      GetModuleBaseName(hProcess, hMod, szProcessName, sizeof(szProcessName) / sizeof(TCHAR));
    }
  }
  wstring ws(szProcessName);
  string processName(ws.begin(), ws.end());
  if (processName.compare("<unknown>")) {
    info.name = processName;
    info.known = true;
  }
  CloseHandle(hProcess);
  return info;
}

string query(string output, int indent) {
  print(output, indent, false);
  string input;
  getline(cin, input);
  return input;
}

int main(int argc, char *argv[]) {
  const clock_t start_time = clock();
  print("--------------------------------------------------");
  if (argc < 2) {
    printHelp();
    goto end;
  }
  else {
    try {
      string method(argv[1]);
      method = toLower(method);
      if (method.compare("filesize") == 0) {
        string path = getArg(argc, argv, "path", EMPTY_STRING);
        if (path.compare("") == 0)
          print("Please Provide a path to find the size of with the 'path' parameter");
        else {
          char* strArr = new char[100 + path.length()];
          std::sprintf(strArr, "Calulate the size of '%s'", path.c_str());
          print(strArr);
          bool log = getBoolArg(argc, argv, "log", false);
          unsigned long long  f_size = 0;
          getFolderSize(path, f_size, log);
          FileSize size = FileSize::convertByteCount(f_size);
          char* strArr2 = new char[100];
          std::sprintf(strArr2, "%0.5lF %s -- %llu bytes", size.size, FileSize::getUnitName(size.unit).c_str(), f_size);
          print(strArr2, 1);
          goto end;
        }
      }
      else if (method.compare("find") == 0) {
        string path = getArg(argc, argv, "path", EMPTY_STRING);
        string regex = getArg(argc, argv, "match", REGEX_ALL);
        if (path.compare("") == 0)
          print("Please Provide a path to find a match inside of with the 'path' parameter");
        bool filesOnly = getBoolArg(argc, argv, "files-only", false);
        char* strArr_2 = new char[100 + path.length() + regex.length()];
        sprintf(strArr_2, "Find a match for \"%s\" in \"%s\"", regex.c_str(), path.c_str());
        print(strArr_2);
        findMatch(path, regex, filesOnly);
      }
      else if (method.compare("find2") == 0) {
        string path = getArg(argc, argv, "path", EMPTY_STRING);
        string regex = getArg(argc, argv, "match", REGEX_ALL);
        if (path.compare("") == 0)
          print("Please Provide a path to find a match inside of with the 'path' parameter");
        char* strArr_2 = new char[100 + path.length() + regex.length()];
        sprintf(strArr_2, "Find a match for \"%s\" in \"%s\"", regex.c_str(), path.c_str());
        print(strArr_2);
        _findMatch(path, regex);
      }
      else if (method.compare("listen") == 0) {
        int port = getIntArg(argc, argv, "port", 5555);
        string protocol = getArg(argc, argv, "protocol", "tcp");
        string host = getArg(argc, argv, "host", "localhost");
        char* strArr = new char[100 + protocol.length() + host.length()];
        sprintf(strArr, "Protocol: %s, Host: %s, Port: %d", protocol.c_str(), host.c_str(), port);
        print(strArr, 1);
        print("This feature is not yet completed", 1);
      }
      else if (method.compare("process") == 0) {
        const string log_info = "log-info";
        string option = getArg(argc, argv, "option", log_info);
        string match = getArg(argc, argv, "match", REGEX_ALL);
        bool ignoreUnknowns = getBoolArg(argc, argv, "unknowns", true);
        option = toLower(option);
        vector<ProcessInfo> processes;
        DWORD aProcesses[1024], cbNeeded, cProcesses;
        if (!EnumProcesses(aProcesses, sizeof(aProcesses), &cbNeeded)) {
          print("Could not Enumerate Processes", 1);
          return 1;
        }
        cProcesses = cbNeeded / sizeof(DWORD);
        for (unsigned int i = 0; i < cProcesses; i++) {
          if (aProcesses[i] != 0) {
            ProcessInfo info = getProcessInfo(aProcesses[i]);
            processes.push_back(info);
          }
        }
        if (option.compare(log_info) == 0) {
          regex regular_expression(match.c_str());
          for (ProcessInfo info : processes) {
            if (ignoreUnknowns && !info.known) continue;
            if (regex_match(info.name, regular_expression)) {
              char* strArr = new char[100 + info.name.length()];
              sprintf(strArr, "%s - %d", info.name.c_str(), info.pid);
              print(strArr, 1);
            }
          }
        }
        else if (option.compare("kill") == 0) {
          vector<ProcessInfo> matching;
          regex regular_expression(match.c_str());
          for (ProcessInfo info : processes) {
            if (!(ignoreUnknowns && !info.known) && regex_match(toLower(info.name), regular_expression)) {
              matching.push_back(info);
              char* strArr = new char[100 + info.name.length()];
              sprintf(strArr, "%s - %d", info.name.c_str(), info.pid);
              print(strArr, 1);
            }
          }
          if (matching.size() > 0) {
            string input = toLower(query("Are you sure you want to kill all of these processes?  "));
            if (input.compare("y") == 0) {
              for (ProcessInfo info : matching) {
                try {
                  char* strArr2 = new char[100];
                  sprintf(strArr2, "Attempting to kill PID %d", info.pid);
                  print(strArr2, 2);
                  DWORD dwDesiredAccess = PROCESS_TERMINATE;
                  bool bInheritHandle = false;
                  HANDLE hProcess = OpenProcess(dwDesiredAccess, bInheritHandle, info.pid);
                  if (hProcess == NULL) throw new exception("Could not access process");
                  BOOL result = TerminateProcess(hProcess, 0);
                  CloseHandle(hProcess);
                }
                catch (exception& e) {
                  char* strArr3 = new char[100];
                  sprintf(strArr3, "Error killing process with PID %d", info.pid);
                  print(strArr3, 3);
                  print(e.what(), 3);
                }
              }
            }
            else print("Cancelling", 1);
          }
        }
      }
      else {
        char* strArr_1 = new char[100 + method.length()];
        std::sprintf(strArr_1, "Unknown Method: \"%s\"\n", method.c_str());
        print(strArr_1);
        printHelp();
      }
    }
    catch (exception& e) { print(e.what()); }
  }

end:
  char* strArr_0 = new char[100];
  sprintf(strArr_0, "\nProcessed in %f seconds", float(clock() - start_time) / CLOCKS_PER_SEC);
  print(strArr_0, 1);

  return 0;
}

