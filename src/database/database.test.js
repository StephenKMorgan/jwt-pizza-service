
const { DB } = require('../database/database.js');

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}


describe('Database', () => {
    test('dummy test', () => {
        expect(1).toBe(1);
    });

    test('getUser should throw error if user not found', async () => {
        const email = randomName() + '@database.com';
        const password = 'toomanysecrets';
        try {
            await DB.getUser(email, password);
        } catch (error) {
            expect(error.message).toBe('unknown user');
        }
    });
});