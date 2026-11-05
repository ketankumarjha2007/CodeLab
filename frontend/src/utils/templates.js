export const STARTER_TEMPLATES = {
  c: `#include <stdio.h>

int main() {
    // Write C code here
    printf("🚀 Welcome to CodeLab!\\n");
    printf("Write. Run. Learn.\\n");
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

int main() {
    // Fast I/O
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::cout << "🚀 Welcome to CodeLab (C++17)!" << std::endl;
    std::cout << "Write. Run. Learn." << std::endl;
    return 0;
}
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Welcome to CodeLab (OpenJDK 21)!");
        System.out.println("Write. Run. Learn.");
    }
}
`,
  python: `def main():
    print("🚀 Welcome to CodeLab (Python 3)!")
    print("Write. Run. Learn.")

if __name__ == "__main__":
    main()
`
};

export const LANGUAGE_CONFIGS = {
  c: {
    id: 'c',
    name: 'C',
    extension: 'c',
    filename: 'main.c',
    monacoLanguage: 'c',
    defaultVersion: 'GCC (C11)',
    badgeColor: 'from-blue-600 to-cyan-500',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10'
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: 'cpp',
    filename: 'main.cpp',
    monacoLanguage: 'cpp',
    defaultVersion: 'G++ (C++14)',
    badgeColor: 'from-blue-700 to-indigo-600',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10'
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: 'java',
    filename: 'Main.java',
    monacoLanguage: 'java',
    defaultVersion: 'OpenJDK 21',
    badgeColor: 'from-amber-600 to-orange-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10'
  },
  python: {
    id: 'python',
    name: 'Python',
    extension: 'py',
    filename: 'main.py',
    monacoLanguage: 'python',
    defaultVersion: 'CPython 3.12+',
    badgeColor: 'from-emerald-600 to-teal-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10'
  }
};
