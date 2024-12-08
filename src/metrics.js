// metrics.js
const fetch = require('node-fetch');
const config = require('./config.js');
const os = require('os');

class Metrics {
  constructor() {
    this.counts = {
      requests: { GET: 0, POST: 0, PUT: 0, DELETE: 0, total: 0 },
      auth: { successful: 0, failed: 0 },
      users: { active: 0 },
      pizza: { sold: 0, creationFailures: 0, revenue: 0 },
      latency: {
        service: [],
        pizzaCreation: []
      }
    };

    setInterval(() => this.sendMetrics(), 5000);
  }

  incrementRequests(method) {
    this.counts.requests[method]++;
    this.counts.requests.total++;
  }

  incrementAuthAttempts(successful) {
    const key = successful ? 'successful' : 'failed';
    this.counts.auth[key]++;
    // console.log(`Auth ${key}: ${this.counts.auth[key]}`);
  }

  incrementActiveUsers() {
    this.counts.users.active++;
    // console.log(`Active users: ${this.counts.users.active}`);
  }

  decrementActiveUsers() {
    this.counts.users.active = Math.max(0, this.counts.users.active - 1);
    // console.log(`Active users: ${this.counts.users.active}`);
  }

  incrementPizzaMetrics(type, value = 1, price = 0) {
    if (type === 'sold') {
      this.counts.pizza.sold += value;
      this.counts.pizza.revenue += price;
    } else if (type === 'creationFailures') {
      this.counts.pizza.creationFailures += value;
    }
  }

  recordLatency(type, latency) {
    if (type === 'service' || type === 'pizzaCreation') {
      this.counts.latency[type].push(latency);
    }
  }

  async sendMetrics() {
    try {
        const serviceLatency = this.counts.latency.service.length > 0 
        ? (this.counts.latency.service[this.counts.latency.service.length - 1] || 0)
        : 0;
      
      // Clear all but latest value
      if (this.counts.latency.service.length > 1) {
        const latestValue = this.counts.latency.service[this.counts.latency.service.length - 1];
        this.counts.latency.service = [latestValue];
      }
      
      const pizzaLatency = this.counts.latency.pizzaCreation.length > 0
        ? (this.counts.latency.pizzaCreation[this.counts.latency.pizzaCreation.length - 1] || 0)
        : 0;
      
      // Clear all but latest value  
      if (this.counts.latency.pizzaCreation.length > 1) {
        const latestValue = this.counts.latency.pizzaCreation[this.counts.latency.pizzaCreation.length - 1];
        this.counts.latency.pizzaCreation = [latestValue];
      }

      const metricsToSend = [
        ['request', 'all', 'total', this.counts.requests.total],
        ['request', 'GET', 'total', this.counts.requests.GET],
        ['request', 'POST', 'total', this.counts.requests.POST],
        ['request', 'PUT', 'total', this.counts.requests.PUT],
        ['request', 'DELETE', 'total', this.counts.requests.DELETE],
        ['auth', 'successful', 'total', this.counts.auth.successful],
        ['auth', 'failed', 'total', this.counts.auth.failed],
        ['users', 'active', 'total', this.counts.users.active],
        ['pizza', 'sold', 'total', this.counts.pizza.sold],
        ['pizza', 'creationFailures', 'total', this.counts.pizza.creationFailures],
        ['pizza', 'revenue', 'total', this.counts.pizza.revenue],
        ['system', 'cpu', 'usage', this.getCpuUsage()],
        ['system', 'memory', 'usage', this.getMemoryUsage()],
        ['latency', 'service', 'avg', serviceLatency],
        ['latency', 'pizzaCreation', 'avg', pizzaLatency]
      ];


      //console.log('\nPushing metrics:');
      // Add delay between metric sends to avoid rate limiting
      for (const [prefix, method, name, value] of metricsToSend) {
        await this.sendMetricToGrafana(prefix, method, name, value);
        // Add 100ms delay between sends
        await new Promise(resolve => setTimeout(resolve, 100));
        //console.log(`${prefix}.${method}.${name}: ${value}`);
      }

      // Reset counters after successful send
      this.resetCounters();
      //console.log('');

    } catch (error) {
      console.error('Error sending metrics:', error);
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

  resetCounters() {
    // Reset all counters except active users
    // this.counts.requests = { GET: 0, POST: 0, PUT: 0, DELETE: 0, total: 0 };
    // this.counts.auth = { successful: 0, failed: 0 };
    // this.counts.pizza = { sold: 0, creationFailures: 0, revenue: 0 };
    // this.counts.latency = {
    //   service: [],
    //   pizzaCreation: []
    // };
  }

  async sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;
    try {
      // Add retry logic with exponential backoff
      let retries = 3;
      let delay = 200;

      while (retries > 0) {
        const response = await fetch(`${config.metrics.url}`, {
          method: 'post',
          body: metric,
          headers: {
            'Authorization': `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
            'Content-Type': 'text/plain'
          },
        });

        if (response.ok) {
          return;
        }

        if (response.status === 429) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          //console.error('Failed to push metrics:', response.status, response.statusText);
          return;
        }
      }
    } catch (error) {
      console.error('Error pushing metrics:', error);
    }
  }
}

const metrics = new Metrics();
module.exports = metrics;