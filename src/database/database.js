const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('../config.js');
const { StatusCodeError } = require('../endpointHelper.js');
const { Role } = require('../model/model.js');
const dbModel = require('./dbModel.js');
class DB {
  constructor() {
    this.initialized = this.initializeDatabase();
  }
  async getMenu() {
    const connection = await this.getConnection();
    try {
      const rows = await this.query(connection, `SELECT * FROM menu`);
      return rows;
    } finally {
      connection.end();
    }
  }
  async addMenuItem(item) {
    const connection = await this.getConnection();
    try {
      const addResult = await this.query(connection, `INSERT INTO menu (title, description, image, price) VALUES (?, ?, ?, ?)`, [item.title, item.description, item.image, item.price]);
      return { ...item, id: addResult.insertId };
    } finally {
      connection.end();
    }
  }
  async addUser(user) {
    const connection = await this.getConnection();
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const userResult = await this.query(connection, `INSERT INTO user (name, email, password) VALUES (?, ?, ?)`, [user.name, user.email, hashedPassword]);
      const userId = userResult.insertId;
      for (const role of user.roles) {
        switch (role.role) {
          case Role.Franchisee: {
            const franchiseId = await this.getID(connection, 'name', role.object, 'franchise');
            await this.query(connection, `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [userId, role.role, franchiseId]);
            break;
          }
          default: {
            await this.query(connection, `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [userId, role.role, 0]);
            break;
          }
        }
      }
      return { ...user, id: userId, password: undefined };
    } finally {
      connection.end();
    }
  }
  async getUser(email, password) {
    const connection = await this.getConnection();
    try {
      const userResult = await this.query(connection, `SELECT * FROM user WHERE email=?`, [email]);
      const user = userResult[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new StatusCodeError('unknown user', 404);
      }
      const roleResult = await this.query(connection, `SELECT * FROM userRole WHERE userId=?`, [user.id]);
      const roles = roleResult.map((r) => {
        return { objectId: r.objectId || undefined, role: r.role };
      });
      return { ...user, roles: roles, password: undefined };
    } finally {
      connection.end();
    }
  }
  async updateUser(userId, email, password) {
    const connection = await this.getConnection();
    try {
      if (email) {
        await this.query(connection, 
          'UPDATE user SET email = ? WHERE id = ?',
          [email, userId]
        );
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.query(connection, 
          'UPDATE user SET password = ? WHERE id = ?',
          [hashedPassword, userId]
        );
      }
      return this.getUser(email, password);
    } finally {
      connection.end();
    }
  }
  async loginUser(userId, token) {
    token = this.getTokenSignature(token);
    const connection = await this.getConnection();
    try {
      await this.query(connection, `INSERT INTO auth (token, userId) VALUES (?, ?)`, [token, userId]);
    } finally {
      connection.end();
    }
  }
  async isLoggedIn(token) {
    token = this.getTokenSignature(token);
    const connection = await this.getConnection();
    try {
      const authResult = await this.query(connection, `SELECT userId FROM auth WHERE token=?`, [token]);
      return authResult.length > 0;
    } finally {
      connection.end();
    }
  }
  async logoutUser(token) {
    token = this.getTokenSignature(token);
    const connection = await this.getConnection();
    try {
      await this.query(connection, `DELETE FROM auth WHERE token=?`, [token]);
    } finally {
      connection.end();
    }
  }
  async getOrders(user, page = 1) {
    const connection = await this.getConnection();
    try {
      const limit = parseInt(config.db.listPerPage);
      const offset = this.getOffset(page, limit);
      
      const orders = await this.query(
        connection,
        'SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId = ? LIMIT ? OFFSET ?',
        [user.id, limit, offset]
      );
      
      for (const order of orders) {
        const items = await this.query(
          connection,
          'SELECT id, menuId, description, price FROM orderItem WHERE orderId = ?',
          [order.id]
        );
        order.items = items;
      }
      
      return { dinerId: user.id, orders: orders, page };
    } finally {
      connection.end();
    }
  }
  async addDinerOrder(user, order) {
    const connection = await this.getConnection();
    try {
      const orderResult = await this.query(connection, `INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())`, [user.id, order.franchiseId, order.storeId]);
      const orderId = orderResult.insertId;
      for (const item of order.items) {
        const menuId = await this.getID(connection, 'id', item.menuId, 'menu');
        await this.query(connection, `INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`, [orderId, menuId, item.description, item.price]);
      }
      return { ...order, id: orderId };
    } finally {
      connection.end();
    }
  }
  async createFranchise(franchise) {
    const connection = await this.getConnection();
    try {
      for (const admin of franchise.admins) {
        const adminUser = await this.query(connection, `SELECT id, name FROM user WHERE email=?`, [admin.email]);
        if (adminUser.length == 0) {
          throw new StatusCodeError(`unknown user for franchise admin ${admin.email} provided`, 404);
        }
        admin.id = adminUser[0].id;
        admin.name = adminUser[0].name;
      }
      const franchiseResult = await this.query(connection, `INSERT INTO franchise (name) VALUES (?)`, [franchise.name]);
      franchise.id = franchiseResult.insertId;
      for (const admin of franchise.admins) {
        await this.query(connection, `INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`, [admin.id, Role.Franchisee, franchise.id]);
      }
      return franchise;
    } finally {
      connection.end();
    }
  }
  async deleteFranchise(franchiseId) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      try {
        await this.query(connection, `DELETE FROM store WHERE franchiseId=?`, [franchiseId]);
        await this.query(connection, `DELETE FROM userRole WHERE objectId=?`, [franchiseId]);
        await this.query(connection, `DELETE FROM franchise WHERE id=?`, [franchiseId]);
        await connection.commit();
      } catch {
        await connection.rollback();
        throw new StatusCodeError('unable to delete franchise', 500);
      }
    } finally {
      connection.end();
    }
  }
  async getFranchises(authUser) {
    const connection = await this.getConnection();
    try {
      const franchises = await this.query(connection, `SELECT id, name FROM franchise`);
      for (const franchise of franchises) {
        if (authUser?.isRole(Role.Admin)) {
          await this.getFranchise(franchise);
        } else {
          franchise.stores = await this.query(connection, `SELECT id, name FROM store WHERE franchiseId=?`, [franchise.id]);
        }
      }
      return franchises;
    } finally {
      connection.end();
    }
  }
  async getUserFranchises(userId) {
    const connection = await this.getConnection();
    try {
      const roleResults = await this.query(
        connection, 
        'SELECT objectId FROM userRole WHERE role = ? AND userId = ?',
        ['franchisee', userId]
      );
      
      if (roleResults.length === 0) {
        return [];
      }
      
      const franchiseIds = roleResults.map(v => v.objectId);
      const placeholders = franchiseIds.map(() => '?').join(',');
      
      const franchises = await this.query(
        connection,
        `SELECT id, name FROM franchise WHERE id IN (${placeholders})`,
        franchiseIds
      );
      
      for (const franchise of franchises) {
        await this.getFranchise(franchise);
      }
      return franchises;
    } finally {
      connection.end();
    }
  }
// In database.js, update the query to use the correct column name
async getFranchise(franchise) {
  const connection = await this.getConnection();
  try {
    const admins = await this.query(
      connection,
      `SELECT u.id, u.name, u.email 
       FROM userRole AS ur 
       JOIN user AS u ON u.id=ur.userId 
       WHERE ur.objectId=? AND ur.role=?`, 
      [franchise.id, Role.Franchisee]  // Use Role.Franchisee instead of 'franchisee'
    );
    
    franchise.admins = admins;
    franchise.stores = await this.query(
      connection,
      `SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue 
       FROM store AS s
       LEFT JOIN dinerOrder AS do ON s.id=do.storeId
       LEFT JOIN orderItem AS oi ON do.id=oi.orderId
       WHERE s.franchiseId=?
       GROUP BY s.id`,
      [franchise.id]
    );
    return franchise;
  } finally {
    connection.end();
  }
}
  async createStore(franchiseId, store) {
    const connection = await this.getConnection();
    try {
      const insertResult = await this.query(connection, `INSERT INTO store (franchiseId, name) VALUES (?, ?)`, [franchiseId, store.name]);
      return { id: insertResult.insertId, franchiseId, name: store.name };
    } finally {
      connection.end();
    }
  }
  async deleteStore(franchiseId, storeId) {
    const connection = await this.getConnection();
    try {
      await this.query(connection, `DELETE FROM store WHERE franchiseId=? AND id=?`, [franchiseId, storeId]);
    } finally {
      connection.end();
    }
  }
  getOffset(currentPage = 1, listPerPage) {
    const page = Math.max(1, parseInt(currentPage));
    const limit = parseInt(listPerPage);
    return (page - 1) * limit;
  }
  getTokenSignature(token) {
    const parts = token.split('.');
    if (parts.length > 2) {
      return parts[2];
    }
    return '';
  }

  sanitizeValue(value) {
    if (typeof value === 'string') {
      // Only escape special characters that could break queries
      return value.replace(/['";\\]/g, '');
    }
    return value;
  }

async query(connection, sql, params) {
  const startTime = Date.now();
  const queryTimeout = 5000; // 5 seconds

  // Sanitize inputs using this.sanitizeValue
  const sanitizedSql = this.sanitizeValue(sql);
  const sanitizedParams = Array.isArray(params) 
    ? params.map(p => this.sanitizeValue(p))
    : params;

  try {
    // Create timeout promise 
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), queryTimeout)
    );

    // Execute query with timeout
    const [results] = await Promise.race([
      connection.execute(sanitizedSql, sanitizedParams),
      timeoutPromise
    ]);

    const duration = Date.now() - startTime;
    
    // Log successful query
    const logger = require('../logger');
    logger.logDatabaseQuery(sanitizedSql, sanitizedParams, duration);
    
    return results;

  } catch (error) {
    const duration = Date.now() - startTime;
    const logger = require('../logger'); 
    
    logger.logError(error, {
      type: 'database',
      query: sanitizedSql,
      params: sanitizedParams,
      duration: `${duration}ms`
    });

    throw error;
  }
}
  async getID(connection, key, value, table) {
    // Whitelist valid tables/columns
    const validTables = ['menu', 'user', 'franchise', 'store'];
    const validColumns = ['id', 'name', 'email'];
    
    if (!validTables.includes(table) || !validColumns.includes(key)) {
      throw new Error('Invalid table or column name');
    }
    
    const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE ${key} = ?`, [value]);
    return rows.length > 0 ? rows[0].id : null;
  }
  async getConnection() {
    // Make sure the database is initialized before trying to get a connection.
    await this.initialized;
    return this._getConnection();
  }
  async _getConnection(setUse = true) {
    const connection = await mysql.createConnection({
      host: config.db.connection.host,
      user: config.db.connection.user,
      password: config.db.connection.password,
      connectTimeout: config.db.connection.connectTimeout,
      decimalNumbers: true,
    });
    if (setUse) {
      await connection.query(`USE ${config.db.connection.database}`);
    }
    return connection;
  }
  async initializeDatabase() {
    try {
      const connection = await this._getConnection(false);
      try {
        const dbExists = await this.checkDatabaseExists(connection);
        console.log(dbExists ? 'Database exists' : 'Database does not exist, creating it');

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.db.connection.database}`);
        await connection.query(`USE ${config.db.connection.database}`);

        if (!dbExists) {
          console.log('Successfully created database');
        }

        for (const statement of dbModel.tableCreateStatements) {
          await connection.query(statement);
        }
        if (!dbExists) {
          const defaultAdmin = { name: '常用名字', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] };
          this.addUser(defaultAdmin);
        }
      } finally {
        connection.end();
      }
    } catch (err) {
      console.error(JSON.stringify({ message: 'Error initializing database', exception: err.message, connection: config.db.connection }));
    }
  }
  async checkDatabaseExists(connection) {
    const [rows] = await connection.execute(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, [config.db.connection.database]);
    return rows.length > 0;
  }
}
const db = new DB();
module.exports = { Role, DB: db };