export type QueueJob<T> = {
  id: string;
  payload: T;
  createdAt: Date;
};

export class InMemoryQueue<T> {
  private jobs: QueueJob<T>[] = [];

  enqueue(payload: T) {
    const job = { id: crypto.randomUUID(), payload, createdAt: new Date() };
    this.jobs.push(job);
    return job;
  }

  dequeue() {
    return this.jobs.shift() ?? null;
  }
}
