// index.js
const express = require('express');
const expressWs = require('express-ws');
const app = express();
const metrics = require('./metrics');
const port = process.argv[2] || 3000;

// Fix router imports
const { authRouter, setAuthUser } = require('./routes/authRouter.js');
const orderRouter = require('./routes/orderRouter.js');  
const franchiseRouter = require('./routes/franchiseRouter.js'); 

// Verify routers exist before using
console.log('Routers loaded:', {
  auth: !!authRouter,
  order: !!orderRouter,
  franchise: !!franchiseRouter
});


expressWs(app);
app.use(express.json());


// Metrics middleware
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  metrics.incrementRequests(req.method);

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latency = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
    console.log("Request: " + req.baseUrl + req.url);

    // Track service-wide latency
    metrics.recordLatency('service', latency);

    // Track pizza creation endpoint specifically
    if (req.method === 'POST' && (req.baseUrl + req.url).startsWith('/api/order')) {
      metrics.recordLatency('pizzaCreation', latency);
    }
  });
  
  const originalJson = res.json;
  const originalStatus = res.status;
  
  res.status = function(code) {
    if (code === 401 || code === 403) {
      // console.log("Failed: " + req.baseUrl + req.url);
      metrics.incrementAuthAttempts(false);
    }
    return originalStatus.apply(res, arguments);
  }

  res.json = function(data) {
    const fullUrl = req.baseUrl + req.url;

    /***Authentication***/
    if (fullUrl.startsWith('/api/auth')) {
      if ((req.method === 'POST' || req.method === 'PUT') && data.token) {
        metrics.incrementAuthAttempts(true);
        metrics.incrementActiveUsers();
      } else if ((req.method === 'POST' || req.method === 'PUT') && !data.token) {
        metrics.incrementAuthAttempts(false);
      } else if (req.method === 'DELETE') {
        if (data.message === 'logout successful') {
          metrics.decrementActiveUsers();
        } else {
          metrics.incrementAuthAttempts(false);
        }
      }
    }

    /***Order***/
    if (fullUrl.startsWith('/api/order')) {
      if (req.method === 'POST' && data.order) {
        data.order.items.forEach(item => {
          metrics.incrementPizzaMetrics('sold', 1, item.price);
        });
      } else if (req.method === 'POST' && !data.order) {
        metrics.incrementPizzaMetrics('creationFailures');
      }
    }
    return originalJson.apply(res, arguments);
  };

  next();
};

// Apply middleware only if it exists
if (typeof metricsMiddleware === 'function') {
  app.use(metricsMiddleware);
}

if (typeof setAuthUser === 'function') {
  app.use(setAuthUser);
}

// Mount routers only if they exist
if (authRouter) app.use('/api/auth', authRouter);
if (orderRouter) app.use('/api/order', orderRouter);
if (franchiseRouter) app.use('/api/franchise', franchiseRouter);

app.listen(port, async () => {
  console.log(`Server started on port ${port}`);
});

module.exports = app;