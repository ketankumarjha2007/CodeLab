export const SUPPORTED_LANGUAGES = {
  c: {
    id: 'c',
    name: 'C',
    extension: 'c',
    filename: 'main.c',
    version: 'GCC (C11)',
    monacoLanguage: 'c',
    starterTemplate: `#include <stdio.h>

int main() {
    printf("Hello from CodeLab!\\n");
    return 0;
}
`,
    compileCmd: ['gcc', '-O0', '-std=c11', 'main.c', '-o', 'main', '-lm'],
    runCmd: ['./main'],
    windowsRunCmd: ['main.exe']
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: 'cpp',
    filename: 'main.cpp',
    version: 'G++ (C++14)',
    monacoLanguage: 'cpp',
    starterTemplate: `#include <iostream>

int main() {
    std::cout << "Hello from CodeLab!" << std::endl;
    return 0;
}
`,
    compileCmd: ['g++', '-O0', '-std=c++14', 'main.cpp', '-o', 'main'],
    runCmd: ['./main'],
    windowsRunCmd: ['main.exe']
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: 'java',
    filename: 'Main.java',
    version: 'OpenJDK 21',
    monacoLanguage: 'java',
    starterTemplate: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from CodeLab!");
    }
}
`,
    compileCmd: ['javac', 'Main.java'],
    runCmd: ['java', '-Xmx128m', 'Main'],
    windowsRunCmd: ['java', '-Xmx128m', 'Main']
  },
  python: {
    id: 'python',
    name: 'Python',
    extension: 'py',
    filename: 'main.py',
    version: 'CPython 3.12+',
    monacoLanguage: 'python',
    starterTemplate: `def main():
    print("Hello from CodeLab!")

if __name__ == "__main__":
    main()
`,
    compileCmd: null,
    runCmd: ['python3', '-u', 'main.py'],
    windowsRunCmd: ['python', '-u', 'main.py']
  }
};
