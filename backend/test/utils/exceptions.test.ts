import * as exc from '../../utils/exceptions';

describe('Exceptions module', () => {
    it('BaseException sets name, timestamp and toJSON', () => {
        const e = new exc.DatabaseException('DB fail', new Error('boom'));
        expect(e.name).toBe('DatabaseException');
        expect(e.timestamp).toBeInstanceOf(Date);
        const json = e.toJSON();
        expect(json.name).toBe('DatabaseException');
        expect(json.errorCode).toBe('DATABASE_ERROR');
        expect(json.details).toBeDefined();
    });

    it('ValidationException stores validationErrors', () => {
        const v = new exc.ValidationException('Invalid', ['a','b']);
        expect(v).toBeInstanceOf(exc.ValidationException);
        expect(v.statusCode).toBe(400);
        const json = v.toJSON();
        expect(json.details.validationErrors).toEqual(['a','b']);
        expect(exc.isValidationException(v)).toBe(true);
    });

    it('TokenExpiredException canRecover flag', () => {
        const t1 = new exc.TokenExpiredException();
        const t2 = new exc.TokenExpiredException('gone', false);
        expect(t1.canRecover).toBe(true);
        expect(t2.canRecover).toBe(false);
        expect(exc.isTokenExpiredException(t1)).toBe(true);
    });

    it('Attachment exceptions and type guard', () => {
        const aNotFound = new exc.AttachmentNotFoundException();
        const aLimit = new exc.AttachmentLimitException('limit', 5);
        expect(exc.isAttachmentException(aNotFound)).toBe(true);
        expect(exc.isAttachmentException(aLimit)).toBe(true);
        expect(exc.isAttachmentException(new exc.SubmissionNotFoundException())).toBe(false);
    });

    it('DatabaseException retains original error message in details', () => {
        const original = new Error('conn');
        const db = new exc.DatabaseException('fail', original);
        const json = db.toJSON();
        expect(json.details.originalError).toBe('conn');
        expect(exc.isDatabaseException(db)).toBe(true);
    });

    it('EmailException carries emailType and isEmailException guard', () => {
        const e = new exc.EmailException('failed', 'welcome');
        expect(e.emailType).toBe('welcome');
        expect(exc.isEmailException(e)).toBe(true);
        expect(e.statusCode).toBe(500);
    });

    it('isBaseException recognizes BaseException instances', () => {
        const v = new exc.ValidationException('x', []);
        expect(exc.isBaseException(v)).toBe(true);
        expect(exc.isBaseException(new Error('no'))).toBe(false);
    });
});
