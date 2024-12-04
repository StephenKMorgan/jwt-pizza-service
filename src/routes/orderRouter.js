const express = require('express');
const config = require('../config.js');
const { Role, DB } = require('../database/database.js');
const { authRouter } = require('./authRouter.js');
const { asyncHandler, StatusCodeError } = require('../endpointHelper.js');

const orderRouter = express.Router();

orderRouter.endpoints = [
  {
    method: 'GET',
    path: '/api/order/menu',
    description: 'Get the pizza menu',
    example: `curl localhost:3000/api/order/menu`,
    response: [{ id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' }],
  },
  {
    method: 'PUT',
    path: '/api/order/menu',
    requiresAuth: true,
    description: 'Add an item to the menu',
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [{ id: 1, title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 }],
  },
  {
    method: 'GET',
    path: '/api/order',
    requiresAuth: true,
    description: 'Get the orders for the authenticated user',
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 },
  },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Create a order for the authenticated user',
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: { order: { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }], id: 1 }, jwt: '1111111111' },
  },
  {
    method: 'PUT',
    path: '/api/order/chaos/:state',
    requiresAuth: true,
    description: 'Enable or disable chaos',
    example: `curl -X PUT localhost:3000/api/order/chaos/true -H 'Authorization'`,
    response: { chaos: true },
  }
];

let enableChaos = false;
// Emergency chaos disable - no auth required
orderRouter.put(
  '/chaos/disable',
  asyncHandler(async (req, res) => {
    enableChaos = false;
    res.json({ chaos: enableChaos });
  })
);
// enableChaos
orderRouter.put(
  '/chaos/:state',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError('unknown endpoint', 404);
    }

    enableChaos = req.params.state === 'true';
    res.json({ chaos: enableChaos });
  })
);
// getMenu
orderRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    if (enableChaos) {
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
    res.send(await DB.getMenu());
  })
);

// addMenuItem
orderRouter.put(
  '/menu',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to add menu item', 403);
    }

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);
    res.send(await DB.getMenu());
  })
);

// getOrders
orderRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const orderReq = req.body;

    // Validate franchise and store exist
    const franchise = await DB.getFranchise({ id: orderReq.franchiseId });
    if (!franchise) {
      throw new StatusCodeError('Invalid franchise', 400);
    }
    
    const storeExists = franchise.stores.some(s => s.id === Number(orderReq.storeId));
    if (!storeExists) {
      throw new StatusCodeError('Invalid store for franchise', 400);
    }

    // Validate items against menu
    const menu = await DB.getMenu();
    for (const item of orderReq.items) {
      const menuItem = menu.find(m => m.id === item.menuId);
      if (!menuItem) {
        throw new StatusCodeError(`Item ${item.menuId} not on menu`, 400);
      }
      // Verify description matches
      if (menuItem.description !== item.description) {
        throw new StatusCodeError(`Invalid description for menu item ${item.menuId}`, 400);
      }
      // Compare price with small tolerance for floating point
      if (Math.abs(menuItem.price - item.price) > 0.000001) {
        throw new StatusCodeError('Price mismatch detected', 400); 
      }
      // Use verified price from menu
      item.price = menuItem.price;
    }

    const order = await DB.addDinerOrder(req.user, orderReq);
    const r = await fetch(`${config.factory.url}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${config.factory.apiKey}` },
      body: JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order }),
    });
    const j = await r.json();
    if (r.ok) {
      res.send({ order, jwt: j.jwt, reportUrl: j.reportUrl });
    } else {
      res.status(500).send({ message: 'Failed to fulfill order at factory', reportUrl: j.reportUrl });
    }
  })
);

module.exports = orderRouter;
