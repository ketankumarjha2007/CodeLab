# CodeLab Compiler Execution Engine
# Hardened minimal execution sandbox
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential compilers and runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    openjdk-21-jdk-headless \
    python3 \
    python3-minimal \
    coreutils \
    bash \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged runner user
RUN groupadd -g 1001 coder && \
    useradd -u 1001 -g coder -m -s /bin/bash coder

# Copy runner script and set strict permissions
COPY runner.sh /runner.sh
RUN chmod 755 /runner.sh

# Set working directory
WORKDIR /workspace
RUN chown -R coder:coder /workspace

# Switch to non-root user
USER coder:coder

ENTRYPOINT ["/bin/bash", "/runner.sh"]
