const request = require('supertest');
const Server = require('../server');

// Mock the database client
jest.mock('../database/client', () => ({
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
    close: jest.fn().mockResolvedValue(true)
}));

describe('Server Tests', () => {
    let server;
    let app;

    beforeEach(() => {
        server = new Server();
        app = server.app;
    });

    afterEach(() => {
        if (server.server && server.server.close) {
            server.server.close();
        }
    });

    describe('Middleware Setup', () => {
        test('should apply security headers', async () => {
            const response = await request(app).get('/api/health');
            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-xss-protection');
        });

        test('should parse JSON bodies', async () => {
            const response = await request(app)
                .post('/api/test')
                .send({ test: 'data' })
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.receivedData).toEqual({ test: 'data' });
        });
    });

    describe('Routes Setup', () => {
        test('should respond to health check', async () => {
            const response = await request(app).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
        });

        test('should respond to API info endpoint', async () => {
            const response = await request(app).get('/api');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
        });

        test('should handle 404 for non-existent routes', async () => {
            const response = await request(app).get('/api/nonexistent');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Server Lifecycle', () => {
        test('should start the server successfully', async () => {
            // Mock the listen method to avoid actually binding to a port
            const listenMock = jest.fn((port, callback) => {
                callback();
                return { close: jest.fn() };
            });
            server.app.listen = listenMock;

            await server.start();
            expect(listenMock).toHaveBeenCalled();
        });

        test('should handle database connection failure', async () => {
            // Mock the database healthCheck to return unhealthy
            const db = require('../database/client');
            db.healthCheck.mockResolvedValueOnce({ status: 'unhealthy', error: 'Test error' });

            // Mock process.exit to avoid terminating the test
            const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});

            await server.start();
            expect(exitMock).toHaveBeenCalledWith(1);

            exitMock.mockRestore();
        });

        test('should handle graceful shutdown', async () => {
            // Mock the server.close method
            const closeMock = jest.fn((callback) => callback());
            server.server = { close: closeMock };

            // Mock process.exit to avoid terminating the test
            const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});

            await server.shutdown('SIGTERM');
            expect(closeMock).toHaveBeenCalled();
            expect(exitMock).toHaveBeenCalledWith(0);

            exitMock.mockRestore();
        });
    });
});
