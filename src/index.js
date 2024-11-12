const app = require('./service.js');
const metrics = require('./metrics.js');
const orderRouter = require('./routes/orderRouter.js');
const franchiseRouter = require('./routes/franchiseRouter.js');
const { authRouter, setAuthUser } = require('./routes/authRouter.js');

const port = process.argv[2] || 3000;

// Middleware to track requests
app.use((req, res, next) => {
  metrics.incrementRequests(req.method);
  next();
});

// Middleware to set authenticated user
app.use(setAuthUser);

// Use routers
app.use('/api/order', orderRouter);
app.use('/api/franchise', franchiseRouter);
app.use('/api/auth', authRouter);

// Track active users
app.post('/api/auth', (req, res, next) => {
  metrics.incrementActiveUsers();
  next();
});

app.delete('/api/auth', (req, res, next) => {
  metrics.decrementActiveUsers();
  next();
});

// Track authentication attempts
authRouter.post(
  '/',
  (req, res, next) => {
    metrics.incrementAuthAttempts(true); // Assuming successful registration
    next();
  }
);

authRouter.put(
  '/',
  (req, res, next) => {
    metrics.incrementAuthAttempts(true); // Assuming successful login
    next();
  }
);

authRouter.delete(
  '/',
  (req, res, next) => {
    metrics.incrementAuthAttempts(false); // Assuming logout
    next();
  }
);

// Track pizza metrics
orderRouter.post(
  '/',
  (req, res, next) => {
    metrics.incrementPizzaMetrics('sold');
    metrics.incrementPizzaMetrics('revenue', req.body.items.reduce((sum, item) => sum + item.price, 0));
    next();
  }
);

orderRouter.post(
  '/pizza-fail',
  (req, res, next) => {
    metrics.incrementPizzaMetrics('creationFailures');
    next();
  }
);

// Track latency
orderRouter.post(
  '/service-endpoint',
  (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      metrics.recordLatency('serviceEndpoint', latency);
    });
    next();
  }
);

orderRouter.post(
  '/pizza-creation',
  (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const latency = Date.now() - start;
      metrics.recordLatency('pizzaCreation', latency);
    });
    next();
  }
);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});