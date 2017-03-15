#pragma once

#include <fstream>
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <iterator>

void print(const char* input, int indent = 0);
void print(std::string input = "", int indent = 0);
void printHelp();
void getFolderSize(std::string rootFolder, unsigned long long &f_size, bool log = false, int logIndent = 1, int depth = 1);
std::string getArg(int argc, char *argv[], std::string name, std::string defaultValue = "");
int main(int argc, char *argv[]);
class StringBuilder {
private:
	std::string main;
	std::string scratch;
	const std::string::size_type ScratchSize = 1024;
public:
	StringBuilder & append(const std::string & str);
	const std::string & str();
};
void findMatch(std::string rootPath, std::string expression);
class FileSize {
public:
  long double size;
  unsigned short unit;
  FileSize(unsigned long long size = 0);
  void incUnit();
  static FileSize convertByteCount(unsigned long long bytes);
  static std::string getUnitName(unsigned short unit);
};