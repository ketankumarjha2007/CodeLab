#!/bin/bash
# CodeLab Sandbox Runner Script
# Usage: /runner.sh <language>

set -o pipefail

LANGUAGE="$1"
WORKSPACE="/workspace"
STDIN_FILE="${WORKSPACE}/stdin.txt"

# Ensure stdin file exists even if empty
if [ ! -f "$STDIN_FILE" ]; then
    touch "$STDIN_FILE"
fi

cd "$WORKSPACE" || exit 1

case "$LANGUAGE" in
    c)
        # Compilation step
        gcc -O2 -std=c17 main.c -o main -lm 2> /tmp/compile.err
        COMPILE_STATUS=$?
        if [ $COMPILE_STATUS -ne 0 ]; then
            cat /tmp/compile.err >&2
            exit 42 # Signal Compilation Error
        fi
        # Execution step
        ./main < "$STDIN_FILE"
        exit $?
        ;;

    cpp)
        # Compilation step
        g++ -O2 -std=c++17 main.cpp -o main 2> /tmp/compile.err
        COMPILE_STATUS=$?
        if [ $COMPILE_STATUS -ne 0 ]; then
            cat /tmp/compile.err >&2
            exit 42 # Signal Compilation Error
        fi
        # Execution step
        ./main < "$STDIN_FILE"
        exit $?
        ;;

    java)
        # Compilation step
        javac Main.java 2> /tmp/compile.err
        COMPILE_STATUS=$?
        if [ $COMPILE_STATUS -ne 0 ]; then
            cat /tmp/compile.err >&2
            exit 42 # Signal Compilation Error
        fi
        # Execution step (heap limited to 128MB to prevent container OOM)
        java -Xmx128m Main < "$STDIN_FILE"
        exit $?
        ;;

    python)
        # Execution step (CPython unbuffered)
        python3 -u main.py < "$STDIN_FILE"
        exit $?
        ;;

    *)
        echo "Unsupported language: $LANGUAGE" >&2
        exit 1
        ;;
esac
