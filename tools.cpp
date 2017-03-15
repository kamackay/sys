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
#include <iterator>
#include <algorithm>
#include <filesystem>

using namespace std;
using namespace std::tr2::sys;

void print(const char* input, int indent) {
  StringBuilder* sb = new StringBuilder();
  for (int i = 0; i < indent; i++) sb->append("    ");
  sb->append(input);
  //sb->append("\n");
  ofstream fs("tools.out.log", fstream::out | fstream::app);
  const string _str = sb->str();
  fs << _str.c_str() << endl;
  fs.close();
  cout << _str.c_str() << endl;
}

void print(const string input, int indent) {
  print(input.c_str(), indent);
}

void printHelp() {
  print("Options:");
  print("- filesize:", 1);
  print("- path=<PathName>", 2);
  print("- log=<true or false> (Default false)", 2);
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

void getFolderSize(string rootFolder, unsigned long long &f_size, bool log, int logIndent, int depth) {
  if (log) print(rootFolder, logIndent + depth);
  try {
    path folderPath(rootFolder);
    if (exists(folderPath)) {
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
      }
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
  switch (unit) {
  case 0:
  default:
    return "bytes";
  case 1:
    return "KB";
  case 2:
    return "MB";
  case 3:
    return "GB";
  case 4:
    return "TB";
  case 5:
    return "PB";
  case 6:
    return "ZB";
  }
}

int main(int argc, char *argv[]) {
  const clock_t start_time = clock();
  print("--------------------------------------------------");
  if (argc < 2) {
    printHelp();
    goto end;
  }
  else {
    string method(argv[1]);
    if (toLower(method).compare("filesize") == 0) {
      string path = getArg(argc, argv, "path", "");
      if (path.compare("") == 0) {
        print("Please Provide a path to find the size of with the 'path' parameter");
      }
      else {
        char* strArr = new char[100 + path.length()];
        sprintf(strArr, "Calulate the size of '%s'", path.c_str());
        print(strArr);
        string log_str = getArg(argc, argv, "log", "false");
        bool log = toLower(log_str).compare("true") == 0;
        unsigned long long  f_size = 0;
        getFolderSize(path, f_size, log);
        FileSize size = FileSize::convertByteCount(f_size);
        char* strArr2 = new char[100];
        sprintf(strArr2, "%0.5lF %s", size.size, FileSize::getUnitName(size.unit).c_str());
        print(strArr2, 1);
        goto end;
      }
    }
  }

end:
  char* strArr_0 = new char[100];
  sprintf(strArr_0, "\nProcessed in %f seconds", float(clock() - start_time) / CLOCKS_PER_SEC);
  print(strArr_0, 1);

  return 0;
}

