type StatusCounts = Record<number, number>;

class MetricsStore {
  requestsTotal = 0;
  statusCounts: StatusCounts = {};
  totalLatencyMs = 0;

  observe(statusCode: number, latencyMs: number) {
    this.requestsTotal += 1;
    this.statusCounts[statusCode] = (this.statusCounts[statusCode] ?? 0) + 1;
    this.totalLatencyMs += latencyMs;
  }

  snapshot() {
    const avgLatencyMs =
      this.requestsTotal > 0 ? Math.round((this.totalLatencyMs / this.requestsTotal) * 10) / 10 : 0;
    return {
      requestsTotal: this.requestsTotal,
      avgLatencyMs,
      statusCounts: this.statusCounts
    };
  }
}

export const metricsStore = new MetricsStore();

