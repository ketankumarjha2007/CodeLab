import { CONSTANTS, EXECUTION_STATUS } from '../config/constants.js';

class ExecutionQueue {
  constructor(concurrency = CONSTANTS.MAX_CONCURRENT_EXECUTIONS, maxWaiting = CONSTANTS.MAX_QUEUE_WAITING) {
    this.concurrency = concurrency;
    this.maxWaiting = maxWaiting;
    this.activeCount = 0;
    this.waitingQueue = [];
  }

  async run(taskFn) {
    if (this.activeCount < this.concurrency) {
      this.activeCount++;
      try {
        return await taskFn();
      } finally {
        this.activeCount--;
        this.next();
      }
    }

    if (this.waitingQueue.length >= this.maxWaiting) {
      const err = new Error('Server execution queue is full. Please try again shortly.');
      err.status = EXECUTION_STATUS.QUEUE_FULL;
      err.statusCode = 429;
      throw err;
    }

    return new Promise((resolve, reject) => {
      this.waitingQueue.push({ taskFn, resolve, reject });
    });
  }

  next() {
    if (this.waitingQueue.length > 0 && this.activeCount < this.concurrency) {
      const { taskFn, resolve, reject } = this.waitingQueue.shift();
      this.activeCount++;
      taskFn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeCount--;
          this.next();
        });
    }
  }

  getStats() {
    return {
      active: this.activeCount,
      waiting: this.waitingQueue.length,
      maxConcurrency: this.concurrency,
      maxWaiting: this.maxWaiting
    };
  }
}

export const executionQueue = new ExecutionQueue();
