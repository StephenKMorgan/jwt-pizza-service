const config = require('./config.js');

class Logger {
  constructor() {
    this.grafanaEnabled = !!(config.logging?.url && config.logging?.userId && config.logging?.apiKey);
    if (!this.grafanaEnabled) {
      console.warn('Grafana logging disabled - missing configuration');
    }
  }

  // Log levels
  static LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  };

  // Log types
  static TYPES = {
    HTTP: 'http',
    DATABASE: 'database',
    FACTORY: 'factory',
    ERROR: 'error'
  };

  httpLogger = (req, res, next) => {
    const startTime = Date.now();

    // Capture original methods
    let send = res.send;
    let json = res.json;

    // Override send
    res.send = (resBody) => {
      this.logHttpRequest(req, res, resBody, Date.now() - startTime);
      res.send = send;
      return res.send(resBody);
    };

    // Override json
    res.json = (resBody) => {
      this.logHttpRequest(req, res, resBody, Date.now() - startTime);
      res.json = json;
      return res.json(resBody);
    };

    next();
  };

  logHttpRequest(req, res, resBody, duration) {
    const logData = {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        authorized: !!req.headers.authorization,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        reqBody: this.sanitize(req.body),
        resBody: this.sanitize(resBody)
    };
    const level = this.statusToLogLevel(res.statusCode);
    this.log(level, Logger.TYPES.HTTP, logData);
    }

  logDatabaseQuery(query, params, duration) {
    const logData = {
      timestamp: new Date().toISOString(),
      reqBody: this.sanitizeSQL(query),
      params: this.sanitize(params),
      duration: `${duration}ms`
    };
    this.log(Logger.LEVELS.DEBUG, Logger.TYPES.DATABASE, logData);
  }

  logFactoryRequest(method, path, reqBody, resBody, duration) {
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      path,
      reqBody: this.sanitize(reqBody),
      resBody: this.sanitize(resBody),
      duration: `${duration}ms`
    };
    this.log(Logger.LEVELS.DEBUG, Logger.TYPES.FACTORY, logData);
  }

  logError(error, context = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: this.sanitize(context)
    };
    this.log(Logger.LEVELS.ERROR, Logger.TYPES.ERROR, logData);
  }

  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return Logger.LEVELS.ERROR;
    if (statusCode >= 400) return Logger.LEVELS.WARN;
    return Logger.LEVELS.INFO;
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  sanitize(data) {
    if (!data) return data;
    const sanitized = JSON.stringify(data);
    return sanitized.replace(/("password"|"token"|"apiKey"|"secret"):\s*"[^"]*"/g, '$1:"*****"');
  }

  sanitizeSQL(query) {
    if (!query) return query;
    return query.replace(/'([^']*password[^']*)'/gi, "'*****'");
  }

  async log(level, type, logData) {
    const labels = { 
      component: config.logging?.source || 'jwt-pizza-service', 
      level, 
      type 
    };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { 
      streams: [{ stream: labels, values: [values] }] 
    };

    if (this.grafanaEnabled) {
      try {
        await this.sendLogToGrafana(logEvent);
      } catch (err) {
        console.error('Failed to send log to Grafana:', err.message);
        this.logToConsole(level, type, logData);
      }
    } else {
      this.logToConsole(level, type, logData);
    }
  }

  logToConsole(level, type, logData) {
    const logFn = {
      [Logger.LEVELS.ERROR]: console.error,
      [Logger.LEVELS.WARN]: console.warn,
      [Logger.LEVELS.INFO]: console.log,
      [Logger.LEVELS.DEBUG]: console.debug
    }[level] || console.log;
    
    logFn(`[${type.toUpperCase()}] ${level.toUpperCase()}:`, logData);
  }

  async sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(`${config.logging.url}`, {
      method: 'post',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
      },
    }).then((res) => {
      if (!res.ok) console.log('Failed to send log to Grafana');
    });
  }
}

module.exports = new Logger();