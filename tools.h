#pragma once

#include <fstream>
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <iterator>

void print(const char* input, int indent = 0);
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