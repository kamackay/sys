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

using namespace std;

void print(const char* input, int indent) {
	StringBuilder* sb = new StringBuilder();
	for (int i = 0; i < indent; i++) sb->append("\t");
	sb->append(input);
	FILE * outputFile = fopen("tools.log", "a");
	const string str = sb->str();
	char strArr[sizeof(str) / sizeof(char)];
	strncpy(strArr, str.c_str(), sizeof(strArr));
	fprintf(outputFile, strArr);
	fprintf(outputFile, "\n");
	cout << str;
	fclose(outputFile);
}

StringBuilder & StringBuilder::append(const std::string & str) {
	scratch.append(str);
	if (scratch.size() > ScratchSize) {
		main.append(scratch);
		scratch.resize(0);
	}
	return *this;
}

const std::string & StringBuilder::str() {
	if (scratch.size() > 0) {
		main.append(scratch);
		scratch.resize(0);
	}
	return main;
}

template<typename Out>
void split(const std::string &s, char delim, Out result) {
	std::stringstream ss;
	ss.str(s);
	std::string item;
	while (std::getline(ss, item, delim)) {
		*(result++) = item;
	}
}


std::vector<std::string> split(const std::string &s, char delim) {
	std::vector<std::string> elems;
	split(s, delim, std::back_inserter(elems));
	return elems;
}


int main(int argc, char *argv[])
{
	for (int i = 1; i < argc; i++) print(argv[i]);
	return 0;
}

