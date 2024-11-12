const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');




let authToken = undefined;
let dinerUserAuthToken = undefined;
let storeId = undefined;
let franchiseId = undefined;
let dinerUser = undefined;
let adminUser = undefined;


const menuItems = [
    { title: 'Pizza Margherita', description: "Its a pizza.", image: "test.qng", price: 0.00099},
    { title: 'Pizza Pepperoni', description: "Its a pizza.", image: "test.qng", price: 0.00099}
];

const menuIds = [];

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
  
    try {
        await DB.addUser(user);
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
  
    user.password = 'toomanysecrets';
    return user;
}

async function createDinerUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Diner }] };
    user.name = randomName();
    user.email = user.name + '@diner.com';

    try {
        await DB.addUser(user);
    } catch (error) {
        console.error('Error creating diner user:', error);
    }

    user.password = 'toomanysecrets';
    return user;
}

async function createFranchise() {
    const franchise = {
        name: randomName(),
        admins: [{ email: adminUser.email }]
    };
    try {
        const res = await request(app)
            .post('/api/franchise')
            .set('Authorization', `Bearer ${authToken}`)
            .send(franchise);
        if (res.status !== 200) {
            throw new Error(`Failed to create franchise: ${res.status} - ${res.body.message}`);
        }
        return res.body;
    } catch (error) {
        console.error('Error creating franchise:', error);
    }
}

describe('Order Router', () => {
    beforeAll(async () => {
        try {
            adminUser = await createAdminUser();
            if (!adminUser) {
                throw new Error('Failed to create admin user');
            }

            dinerUser = await createDinerUser();
            if (!dinerUser) {
                throw new Error('Failed to create diner user');
            }

            const loginResAdmin = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
            if (loginResAdmin.status !== 200 || !loginResAdmin.body.token) {
                throw new Error(`Failed to log in admin user: ${loginResAdmin.status} - ${loginResAdmin.body.message}`);
            }
            authToken = loginResAdmin.body.token;
            
            const loginResDiner = await request(app).put('/api/auth').send({ email: dinerUser.email, password: dinerUser.password });
            if (loginResDiner.status !== 200 || !loginResDiner.body.token) {
                throw new Error(`Failed to log in diner user: ${loginResDiner.status} - ${loginResDiner.body.message}`);
            }
            dinerUserAuthToken = loginResDiner.body.token;
        } catch (error) {
            console.error('Error in beforeAll setup:', error);
        }
    });

    beforeEach(async () => {
        try {
            const franchise = await createFranchise();
            if (!franchise || !franchise.id) {
                throw new Error('Failed to create franchise');
            }
            franchiseId = franchise.id;

            const store = {
                franchiseId: franchiseId,
                name: randomName()
            };
            const storeRes = await request(app)
                .post(`/api/franchise/${franchiseId}/store`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(store);
            if (storeRes.status !== 200 || !storeRes.body.id) {
                throw new Error(`Failed to create store: ${storeRes.status} - ${storeRes.body.message}`);
            }
            storeId = storeRes.body.id;

            for (const item of menuItems) {
                item.image = randomName() + '.qng';
                const res = await request(app)
                    .put(`/api/order/menu`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(item);
                if (res.status !== 200) {
                    throw new Error(`Failed to add menu item: ${res.status} - ${res.body.message}`);
                }
                menuIds.push(res.body[res.body.length - 1].id);
            }
        } catch (error) {
            console.error('Error in beforeEach setup:', error);
        }
    });

    afterEach(async () => {
        try {
            // Delete all stores associated with the franchise
            const storeRes = await request(app)
            .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
            .set('Authorization', `Bearer ${authToken}`);
            if (storeRes.status !== 200) {
                throw new Error(`Failed to delete store: ${storeRes.status} - ${storeRes.body.message}`);
            }
    
            // Remove all added menu items
            // const connection = await DB.getConnection();
            // const idsToRemove = [...menuIds]; // Create a copy of the menuIds array

            // for (const id of idsToRemove) {
            //     if (id) {
            //         await DB.query(connection, 'DELETE FROM menu WHERE id = ?', [id]);
            //         // Remove the id from the list of menu items
            //         const index = menuIds.indexOf(id);
            //         if (index > -1) {
            //             menuIds.splice(index, 1);
            //         }
            //     }
            // }
    
            // Delete the franchise
            const franchiseRes = await request(app)
                .delete(`/api/franchise/${franchiseId}`)
                .set('Authorization', `Bearer ${authToken}`);
            if (franchiseRes.status !== 200) {
                throw new Error(`Failed to delete franchise: ${franchiseRes.status} - ${franchiseRes.body.message}`);
            }
        } catch (error) {
            console.error('Error in afterEach cleanup:', error);
        }
    });

    // afterAll(async () => {
    //     try {
    //         Get connection to the database
    //         const connection = await DB.getConnection();
    //         // Get the user IDs from the user table by their email
    //         const [adminUserResult] = await DB.query(connection, 'SELECT id FROM user WHERE email = ?', [adminUser.email]);
    //         const [dinerUserResult] = await DB.query(connection, 'SELECT id FROM user WHERE email = ?', [dinerUser.email]);

    //         const adminUserId = adminUserResult?.id;
    //         const dinerUserId = dinerUserResult?.id;

    //         if (adminUserId) {
    //             // Remove the admin user from the auth table by their user ID
    //             await DB.query(connection, 'DELETE FROM auth WHERE userId = ?', [adminUserId]);
    //             // Remove the admin user from the userrole table by their user ID
    //             await DB.query(connection, 'DELETE FROM userrole WHERE userId = ?', [adminUserId]);
    //             // Remove the admin user from the user table by their email
    //             await DB.query(connection, 'DELETE FROM user WHERE email = ?', [adminUser.email]);
    //         }

    //         if (dinerUserId) {
    //             // Remove the diner user from the auth table by their user ID
    //             await DB.query(connection, 'DELETE FROM auth WHERE userId = ?', [dinerUserId]);
    //             // Remove the diner user from the userrole table by their user ID
    //             await DB.query(connection, 'DELETE FROM userrole WHERE userId = ?', [dinerUserId]);
    //             // Remove the diner user from the user table by their email
    //             await DB.query(connection, 'DELETE FROM user WHERE email = ?', [dinerUser.email]);
    //         }
    //     } catch (error) {
    //         console.error('Error in afterAll cleanup:', error);
    //     }
    // });

    test('should get the menu', async () => {
        const res = await request(app).get('/api/order/menu');
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    test('should add a menu item', async () => {
        const item = { title: 'Pizza Cheese', description: "Its a pizza.", image: randomName() + '.qng', price: 0.00099 };
        const res = await request(app)
            .put('/api/order/menu')
            .set('Authorization', `Bearer ${authToken}`)
            .send(item);
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThanOrEqual(3);

        //cleanup - add the id to the list of menu items
        menuIds.push(res.body[res.body.length - 1].id);
    });

    test('should not add a menu item for a diner user', async () => {
        const item = { title: 'Pizza Cheese', description: "Its a pizza.", image: randomName() + '.qng', price: 0.00099 };
        const res = await request(app)
            .put('/api/order/menu')
            .set('Authorization', `Bearer ${dinerUserAuthToken}`)
            .send(item);
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('unable to add menu item');
    });

    test('should get orders', async () => {
        const order1 = { franchiseId: franchiseId, storeId: storeId, items: [{ menuId: menuIds[0], description: "Its a pizza.", price: 0.00099 }] };
        const order2 = { franchiseId: franchiseId, storeId: storeId, items: [{ menuId: menuIds[1], description: "Its a pizza.", price: 0.00099 }] };
    
        const res1 = await request(app)
            .post('/api/order')
            .set('Authorization', `Bearer ${authToken}`)
            .send(order1);
        expect(res1.status).toBe(200);
        expect(res1.body).toBeInstanceOf(Object);
    
        const res2 = await request(app)
            .post('/api/order')
            .set('Authorization', `Bearer ${authToken}`)
            .send(order2);
        expect(res2.status).toBe(200);
        expect(res2.body).toBeInstanceOf(Object);
    
        const res = await request(app)
            .get('/api/order')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.orders.length).toBeGreaterThanOrEqual(2);
    
        // Clean up orders
        // const connection = await DB.getConnection();
        // for (const order of res.body.orders) {
        //     // Delete order items associated with the order
        //     await DB.query(connection, 'DELETE FROM orderitem WHERE orderId = ?', [order.id]);
        //     // Optionally, delete the order itself if needed
        //     await DB.query(connection, 'DELETE FROM dinerorder WHERE id = ?', [order.id]);
        // }
    });

    //todo: Look into why the response is always 500
    test('should get orders but factory fails', async () => {
        const order1 = { franchiseId: franchiseId, storeId: storeId, items: [{ menuId: menuIds[0], description: "Its a pizza.", price: 0.00099 }] };

        const res1 = await request(app)
            .post('/api/order')
            .set('Authorization', `Bearer ${authToken}`)
            .send(order1);
        expect(res1.status).toBe(200);
        expect(res1.body).toBeInstanceOf(Object);

        // Clean up orders
        // const connection = await DB.getConnection();
        // const orders = await DB.query(connection, 'SELECT id FROM dinerorder WHERE franchiseId = ? AND storeId = ?', [franchiseId, storeId]);
        // for (const order of orders) {
        //     // Delete order items associated with the order
        //     await DB.query(connection, 'DELETE FROM orderitem WHERE orderId = ?', [order.id]);
        //     // Optionally, delete the order itself if needed
        //     await DB.query(connection, 'DELETE FROM dinerorder WHERE id = ?', [order.id]);
        // }
    });

});