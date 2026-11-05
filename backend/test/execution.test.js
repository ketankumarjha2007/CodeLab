import test from 'node:test';
import assert from 'node:assert/strict';
import { executeCode } from '../src/services/executor.js';
import { EXECUTION_STATUS } from '../src/config/constants.js';

test('Python: Hello World execution', async () => {
  const result = await executeCode({
    language: 'python',
    code: 'print("Hello from CodeLab Test!")',
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /Hello from CodeLab Test!/);
  assert.equal(result.stderr, '');
});

test('Python: STDIN addition', async () => {
  const result = await executeCode({
    language: 'python',
    code: `import sys
lines = sys.stdin.read().split()
if len(lines) >= 2:
    a, b = int(lines[0]), int(lines[1])
    print(f"Sum = {a + b}")
`,
    stdin: '40 2'
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /Sum = 42/);
});

test('Python: Syntax Error detection', async () => {
  const result = await executeCode({
    language: 'python',
    code: 'def broken(: print("oops")',
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.RUNTIME_ERROR);
  assert.match(result.stderr, /SyntaxError/);
});

test('Python: Runtime Error (ZeroDivisionError)', async () => {
  const result = await executeCode({
    language: 'python',
    code: 'x = 10 / 0',
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.RUNTIME_ERROR);
  assert.match(result.stderr, /ZeroDivisionError/);
});

test('Python: Infinite loop timeout', async () => {
  const result = await executeCode({
    language: 'python',
    code: 'while True: pass',
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.TIME_LIMIT_EXCEEDED);
});

test('C: Hello World execution', async () => {
  const result = await executeCode({
    language: 'c',
    code: `#include <stdio.h>
int main() {
    printf("C Hello World\\n");
    return 0;
}`,
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /C Hello World/);
});

test('C: STDIN sum', async () => {
  const result = await executeCode({
    language: 'c',
    code: `#include <stdio.h>
int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("C Sum = %d\\n", a + b);
    }
    return 0;
}`,
    stdin: '15 27'
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /C Sum = 42/);
});

test('C: Compilation error detection', async () => {
  const result = await executeCode({
    language: 'c',
    code: `#include <stdio.h>
int main() {
    undeclared_variable = 10;
    return 0;
}`,
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.COMPILATION_ERROR);
  assert.match(result.stderr, /undeclared/);
});

test('C++: Hello World execution', async () => {
  const result = await executeCode({
    language: 'cpp',
    code: `#include <iostream>
int main() {
    std::cout << "C++ Hello World" << std::endl;
    return 0;
}`,
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /C\+\+ Hello World/);
});

test('Java: Hello World and STDIN', async () => {
  const result = await executeCode({
    language: 'java',
    code: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            System.out.println("Java Sum = " + (a + b));
        } else {
            System.out.println("Java Hello World");
        }
    }
}`,
    stdin: '25 17'
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /Java Sum = 42/);
});

test('Python: Unicode and emoji output', async () => {
  const result = await executeCode({
    language: 'python',
    code: 'print("CodeLab 🚀 日本語 123 π = 3.14159")',
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.ACCEPTED);
  assert.match(result.stdout, /CodeLab 🚀 日本語 123 π = 3\.14159/);
});

test('Python: Large output limit enforcement', async () => {
  const result = await executeCode({
    language: 'python',
    code: 'print("A" * 300000)',
    stdin: ''
  });

  assert.equal(result.status, EXECUTION_STATUS.OUTPUT_LIMIT_EXCEEDED);
});

