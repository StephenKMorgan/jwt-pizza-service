const config = require('./config.json');
const os = require('os');

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.methodCounts = {
      GET: 0,
      POST: 0,
      PUT: 0,
      DELETE: 0,
    };
    this.activeUsers = 0;
    this.authAttempts = {
      successful: 0,
      failed: 0,
    };
    this.pizzaMetrics = {
      sold: 0,
      creationFailures: 0,
      revenue: 0,
    };
    this.latencyMetrics = {
      serviceEndpoint: [],
      pizzaCreation: [],
    };

    // This will periodically send metrics to Grafana
    const timer = setInterval(() => {
      this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
      for (const method in this.methodCounts) {
        this.sendMetricToGrafana('request', method, 'total', this.methodCounts[method]);
      }
      this.sendMetricToGrafana('users', 'active', 'total', this.activeUsers);
      this.sendMetricToGrafana('auth', 'successful', 'total', this.authAttempts.successful);
      this.sendMetricToGrafana('auth', 'failed', 'total', this.authAttempts.failed);
      this.sendMetricToGrafana('pizza', 'sold', 'total', this.pizzaMetrics.sold);
      this.sendMetricToGrafana('pizza', 'creationFailures', 'total', this.pizzaMetrics.creationFailures);
      this.sendMetricToGrafana('pizza', 'revenue', 'total', this.pizzaMetrics.revenue);
      this.sendMetricToGrafana('system', 'cpu', 'usage', this.getCpuUsage());
      this.sendMetricToGrafana('system', 'memory', 'usage', this.getMemoryUsage());

      this.latencyMetrics.serviceEndpoint.forEach((latency, index) => {
        this.sendMetricToGrafana('latency', 'serviceEndpoint', `latency${index}`, latency);
      });
      this.latencyMetrics.pizzaCreation.forEach((latency, index) => {
        this.sendMetricToGrafana('latency', 'pizzaCreation', `latency${index}`, latency);
      });

      // Reset latency metrics
      this.latencyMetrics.serviceEndpoint = [];
      this.latencyMetrics.pizzaCreation = [];
    }, 60000); // Send metrics every minute
    timer.unref();
  }

  incrementRequests(method = 'GET') {
    this.totalRequests++;
    if (this.methodCounts[method] !== undefined) {
      this.methodCounts[method]++;
    }
  }

  incrementActiveUsers() {
    this.activeUsers++;
  }

  decrementActiveUsers() {
    if (this.activeUsers > 0) {
      this.activeUsers--;
    }
  }

  incrementAuthAttempts(successful = true) {
    if (successful) {
      this.authAttempts.successful++;
    } else {
      this.authAttempts.failed++;
    }
  }

  incrementPizzaMetrics(type, value = 1) {
    if (this.pizzaMetrics[type] !== undefined) {
      this.pizzaMetrics[type] += value;
    }
  }

  recordLatency(type, latency) {
    if (this.latencyMetrics[type] !== undefined) {
      this.latencyMetrics[type].push(latency);
    }
  }

  getCpuUsage() {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    for (let cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    const total = user + nice + sys + idle + irq;
    return ((total - idle) / total) * 100;
  }

  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    return ((totalMemory - freeMemory) / totalMemory) * 100;
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }
}

const metrics = new Metrics();
module.exports = metrics;