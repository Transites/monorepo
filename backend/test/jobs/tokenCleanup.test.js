const cron = require('node-cron');
const tokenService = require('../../services/tokens');
const logger = require('../../middleware/logging');
const tokenCleanupJob = require('../../jobs/tokenCleanup');

// 1. Mock do node-cron
// Precisamos capturar a função de callback (o job real) para executá-la manualmente no teste
let cronJobCallback;
jest.mock('node-cron', () => ({
    schedule: jest.fn((time, callback, options) => {
        cronJobCallback = callback;
    })
}));

// 2. Mocks dos serviços e logger
jest.mock('../../services/tokens', () => ({
    cleanupExpiredTokens: jest.fn(),
    findExpiringSubmissions: jest.fn()
}));

jest.mock('../../middleware/logging', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    audit: jest.fn()
}));

describe('TokenCleanupJob', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reseta o estado do job antes de cada teste
        tokenCleanupJob.isRunning = false;
        tokenCleanupJob.lastRun = undefined;
    });

    describe('start() - Cron Job execution', () => {
        beforeEach(() => {
            // Agenda o job, o que preenche nossa variável cronJobCallback
            tokenCleanupJob.start();
        });

        it('should schedule the job with correct cron expression', () => {
            expect(cron.schedule).toHaveBeenCalledWith('0 3 * * *', expect.any(Function), { timezone: 'America/Sao_Paulo' });
            expect(logger.info).toHaveBeenCalledWith('Token cleanup job scheduled (daily at 3:00 AM)');
        });

        it('Branch: should skip execution if already running', async () => {
            tokenCleanupJob.isRunning = true; // Força o estado de execução
            
            await cronJobCallback();
            
            expect(logger.warn).toHaveBeenCalledWith('Token cleanup job already running, skipping');
            expect(tokenService.cleanupExpiredTokens).not.toHaveBeenCalled();
        });

        it('Branch: should complete without expiring alerts if expiredCount is 0', async () => {
            tokenService.cleanupExpiredTokens.mockResolvedValue({ expiredCount: 0 });
            
            await cronJobCallback();
            
            expect(logger.audit).toHaveBeenCalledWith('Automated token cleanup completed', expect.any(Object));
            expect(tokenService.findExpiringSubmissions).not.toHaveBeenCalled();
            expect(tokenCleanupJob.isRunning).toBe(false); // Finally block
        });

        it('Branch: should look for expiring submissions if expiredCount > 0, but log nothing if none found', async () => {
            tokenService.cleanupExpiredTokens.mockResolvedValue({ expiredCount: 1 });
            tokenService.findExpiringSubmissions.mockResolvedValue([]); // Nenhuma submissão vencendo
            
            await cronJobCallback();
            
            expect(tokenService.findExpiringSubmissions).toHaveBeenCalledWith(5);
            expect(logger.info).not.toHaveBeenCalledWith('Submissions expiring soon found', expect.any(Object));
        });

        it('Branch: should log expiring submissions if found', async () => {
            tokenService.cleanupExpiredTokens.mockResolvedValue({ expiredCount: 1 });
            tokenService.findExpiringSubmissions.mockResolvedValue([
                { id: 1, title: 'Test', author_email: 'test@usp.br', days_to_expiry: 2 }
            ]);
            
            await cronJobCallback();
            
            expect(logger.info).toHaveBeenCalledWith('Submissions expiring soon found', expect.objectContaining({
                count: 1
            }));
        });

        it('Branch (Catch): should log error if tokenService fails and reset isRunning', async () => {
            const error = new Error('Database connection failed');
            tokenService.cleanupExpiredTokens.mockRejectedValue(error);
            
            await cronJobCallback();
            
            expect(logger.error).toHaveBeenCalledWith('Error in automated token cleanup', expect.objectContaining({
                error: 'Database connection failed'
            }));
            expect(tokenCleanupJob.isRunning).toBe(false); // Assegura que a trava destravou
        });
    });

    describe('runManual()', () => {
        it('should return result on successful manual run', async () => {
            const expectedResult = { expiredCount: 2 };
            tokenService.cleanupExpiredTokens.mockResolvedValue(expectedResult);
            
            const result = await tokenCleanupJob.runManual();
            
            expect(result).toEqual(expectedResult);
            expect(logger.audit).toHaveBeenCalledWith('Manual token cleanup completed', expect.any(Object));
            expect(tokenCleanupJob.isRunning).toBe(false);
        });

        it('Branch: should throw error if job is already running', async () => {
            tokenCleanupJob.isRunning = true;
            
            await expect(tokenCleanupJob.runManual()).rejects.toThrow('Cleanup job already running');
        });

        it('Branch (Catch): should bubble up error and reset isRunning', async () => {
            tokenService.cleanupExpiredTokens.mockRejectedValue(new Error('Manual error'));
            
            await expect(tokenCleanupJob.runManual()).rejects.toThrow('Manual error');
            expect(logger.error).toHaveBeenCalledWith('Error in manual token cleanup', expect.any(Object));
            expect(tokenCleanupJob.isRunning).toBe(false);
        });
    });

    describe('getStatus()', () => {
        it('should return correct default status', () => {
            const status = tokenCleanupJob.getStatus();
            expect(status.isRunning).toBe(false);
            expect(status.lastRun).toBe(null); // Fallback do '|| null'
            expect(status.nextRun).toBe('3:00 AM daily');
        });

        it('should return lastRun if it is set', () => {
            const date = new Date().toISOString();
            tokenCleanupJob.lastRun = date;
            
            const status = tokenCleanupJob.getStatus();
            expect(status.lastRun).toBe(date);
        });
    });
});