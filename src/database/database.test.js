
const { DB } = require('../database/database.js');

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}


describe('Database', () => {
    test('getUser should throw error if user not found', async () => {
        const email = randomName() + '@database.com';
        const password = 'toomanysecrets';
        
        await expect(DB.getUser(email, password))
            .rejects
            .toThrow('unknown user');
    });

    test('getUser should throw error if password incorrect', async () => {
        // First create a user
        const email = randomName() + '@database.com';
        const name = 'Test User';
        const password = 'correctpassword';
        
        await DB.addUser({
            name,
            email,
            password,
            roles: [{ role: 'diner' }]
        });

        // Try to login with wrong password
        await expect(DB.getUser(email, 'wrongpassword'))
            .rejects
            .toThrow('unknown user');
    });
});