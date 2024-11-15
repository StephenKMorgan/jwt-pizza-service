const express = require('express');
const expressWs = require('express-ws');
const metrics = require('./metrics');
const { authRouter, setAuthUser } = require('./routes/authRouter.js');
const orderRouter = require('./routes/orderRouter.js');
const franchiseRouter = require('./routes/franchiseRouter.js');
const version = require('./version.json');
const config = require('./config.js');

const app = express();
expressWs(app);

// Basic middleware
app.use(express.json());
app.use(setAuthUser);

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Metrics middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  metrics.incrementRequests(req.method);

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latency = (diff[0] * 1e9 + diff[1]) / 1e6;
    metrics.recordLatency('service', latency);

    if (req.method === 'POST' && (req.baseUrl + req.url).startsWith('/api/order')) {
      metrics.recordLatency('pizzaCreation', latency);
    }
  });

  const originalJson = res.json;
  const originalStatus = res.status;

  res.status = function(code) {
    if (code === 401 || code === 403) {
      metrics.incrementAuthAttempts(false);
    }
    return originalStatus.apply(res, arguments);
  }

  res.json = function(data) {
    const fullUrl = req.baseUrl + req.url;

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
});

// API Routes
const apiRouter = express.Router();
app.use('/api', apiRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/order', orderRouter);
apiRouter.use('/franchise', franchiseRouter);

// API Documentation endpoint
apiRouter.use('/docs', (req, res) => {
  res.json({
    version: version.version,
    endpoints: [...authRouter.endpoints, ...orderRouter.endpoints, ...franchiseRouter.endpoints],
    config: { factory: config.factory.url, db: config.db.connection.host },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'welcome to JWT Pizza',
    version: version.version,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'unknown endpoint',
  });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode ?? 500).json({ message: err.message, stack: err.stack });
  next();
});

module.exports = app;