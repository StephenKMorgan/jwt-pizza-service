const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

let dinerUserAuthToken = undefined;
let dinerUser = undefined;

function randomName() {
    return Math.random().toString(36).substring(2, 12);
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

async function removeUser(email){
    if (!email) {
        return;
    }
    try{
        // const connection = await DB.getConnection();
        // const [UserResult] = await DB.query(connection, 'SELECT id FROM user WHERE email = ?', [email]);
        // const UserId = UserResult?.id;
        // await DB.query(connection, 'DELETE FROM auth WHERE userId = ?', [UserId]);
        // await DB.query(connection, 'DELETE FROM userrole WHERE userId = ?', [UserId]);
        // await DB.query(connection, 'DELETE FROM user WHERE email = ?', [email]);
    }
    catch (error) {
        console.error('Error deleting diner user:', error);
    }
}



describe('Auth Router', () => {
    beforeAll(async () => {
        
        dinerUser = await createDinerUser();
        if (!dinerUser) {
            throw new Error('Failed to create diner user');
        }
      });

      afterAll(async () => {
        try{
            await removeUser(dinerUser.email);
        }
        catch (error) {
            console.error('Error deleting diner user:', error);
        }
      });
  
    test('should register a new user', async () => {
        const name = randomName();
        const email = name + '@test.com';
        const password = 'a';
        const registerRes = await request(app).post('/api/auth').send({ name, email, password });
        expect(registerRes.status).toBe(200);
        expect(registerRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

        const user = { name, email, roles: [{ role: 'diner' }] };
        expect(registerRes.body.user).toMatchObject(user);

        //cleanup
        await removeUser(email);
    });

    test('should login an existing user', async () => {
        // Attempt to login with the correct password
        const loginRes = await request(app).put('/api/auth').send({ email: dinerUser.email, password: dinerUser.password });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
 
        expect(loginRes.body.user).toMatchObject({
            id: expect.any(Number),
            name: dinerUser.name,
            email: dinerUser.email,
            roles: expect.arrayContaining([
                expect.objectContaining({
                    role: 'diner'
                })
            ])
        });
        // Cleanup
        const logoutRes = await request(app)
            .delete('/api/auth')
            .set('Authorization', `Bearer ${loginRes.body.token}`);
        expect(logoutRes.status).toBe(200);
    });

    test('should update the user', async () => {
        const name = randomName();
        const email = name + '@test.com';
        const password = 'a';
        const registerRes = await request(app).post('/api/auth').send({ name, email, password });
        const authToken = registerRes.body.token;
        const userId = registerRes.body.user.id;

        const newName = randomName();
        const newEmail = newName + '@test.com';
        const newPassword = 'b';
        const updateRes = await request(app)
            .put(`/api/auth/${userId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ email: newEmail, password: newPassword });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.email).toBe(newEmail);

        //cleanup
        await removeUser(newEmail);
    });

    test('logout', async () => {
        const loginResDiner = await request(app).put('/api/auth').send({ email: dinerUser.email, password: dinerUser.password });
        if (loginResDiner.status !== 200 || !loginResDiner.body.token) {
            throw new Error(`Failed to log in diner user: ${loginResDiner.status} - ${loginResDiner.body.message}`);
        }
        dinerUserAuthToken = loginResDiner.body.token;
        const logoutRes = await request(app)
            .delete('/api/auth')
            .set('Authorization', `Bearer ${dinerUserAuthToken}`);
        expect(logoutRes.status).toBe(200);
        expect(logoutRes.body.message).toBe('logout successful');
    });

    test('unauthorized update attempt', async () => {
        const name = randomName();
        const email = name + '@test.com';
        const password = 'a';
        const registerRes = await request(app).post('/api/auth').send({ name, email, password });
        const userId = registerRes.body.user.id;

        const newName = randomName();
        const newEmail = newName + '@test.com';
        const newPassword = 'b';
        const updateRes = await request(app)
            .put(`/api/auth/${userId}`)
            .send({ email: newEmail, password: newPassword }); // No auth token

        expect(updateRes.status).toBe(401);

        //cleanup
        await removeUser(email);
    });

    test('unauthorized update attempt by non-admin user', async () => {
        const name = randomName();
        const email = name + '@test.com';
        const password = 'a';
        const registerRes = await request(app).post('/api/auth').send({ name, email, password });
        const authToken = registerRes.body.token;

        const anotherUserName = randomName();
        const anotherUserEmail = anotherUserName + '@test.com';
        const anotherUserPassword = 'a';
        const anotherUserRes = await request(app).post('/api/auth').send({ name: anotherUserName, email: anotherUserEmail, password: anotherUserPassword });
        const anotherUserId = anotherUserRes.body.user.id;

        const newEmail = randomName() + '@test.com';
        const updateRes = await request(app)
            .put(`/api/auth/${anotherUserId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ email: newEmail, password: 'b' });

        expect(updateRes.status).toBe(403);
        expect(updateRes.body.message).toBe('unauthorized');

        //cleanup
        await removeUser(email);
        await removeUser(anotherUserEmail);
    });

    test('invalid token during authentication', async () => {
        const invalidToken = 'invalid.token.here';
        const res = await request(app)
            .get('/api/auth/some-protected-route')
            .set('Authorization', `Bearer ${invalidToken}`);

        expect(res.status).toBe(404);
    });

    test('missing fields during registration', async () => {
        const res = await request(app).post('/api/auth').send({ email: 'missing@fields.com' });
        expect(res.status).toBe(400);
    });

    test('invalid password format during registration', async () => {
        const res = await request(app).post('/api/auth').send({ name: 'Invalid Password', email: 'valid@test.com', password: '' });
        expect(res.status).toBe(400);
    });
});

