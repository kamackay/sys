#pragma once

#include <fstream>
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <iterator>

using namespace std;

void print(const char* input, int indent = 0, bool newLine = true);
void print(std::string input = "", int indent = 0, bool newLine = true);
void printHelp();
long getFileSize(std::string filename);
void getFolderSize(std::string rootFolder, unsigned long long &f_size, bool log = false, int logIndent = 1, int depth = 1);
std::string getArg(int argc, char *argv[], std::string name, std::string defaultValue = "");
bool getBoolArg(int argc, char *argv[], std::string name, bool defaultVal);
int getIntArg(int argc, char *argv[], std::string name, int defaultVal);
int main(int argc, char *argv[]);
std::string toLower(std::string in);
string query(string output, int indent = 1);
class StringBuilder {
private:
	std::string main;
	std::string scratch;
	const std::string::size_type ScratchSize = 1024;
public:
	StringBuilder & append(const std::string & str);
	const std::string & str();
};
class ProcessInfo {
public:
  ProcessInfo(int pid, std::string name);
  int pid;
  std::string name;
  bool known = false;
};
void _findMatch(std::string rootPath, std::string expression);
std::vector<std::string> getAllFileSystemEntries(std::string rootPath, bool filesOnly = false);
void findMatch(std::string rootPath, std::string expression, bool filesOnly = true);
class FileSize {
public:
  long double size;
  unsigned short unit;
  FileSize(unsigned long long size = 0);
  void incUnit();
  static FileSize convertByteCount(unsigned long long bytes);
  static std::string getUnitName(unsigned short unit);
};