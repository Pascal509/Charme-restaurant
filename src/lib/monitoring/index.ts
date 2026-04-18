type Metric = {
  name: string;
  value: number;
  tags?: Record<string, string>;
};

export function trackMetric(metric: Metric) {
  void metric;
}

export function trackError(error: Error, context?: Record<string, string>) {
  void error;
  void context;
}
