const validators = require('./validators');

describe('Validators Utility Tests', () => {
    describe('Email Validation', () => {
        test('should validate correct email formats', () => {
            expect(validators.isValidEmail('user@example.com')).toBe(true);
            expect(validators.isValidEmail('user.name@example.co.uk')).toBe(true);
            expect(validators.isValidEmail('user+tag@example.org')).toBe(true);
        });

        test('should reject invalid email formats', () => {
            expect(validators.isValidEmail('user@')).toBe(false);
            expect(validators.isValidEmail('user@example')).toBe(false);
            expect(validators.isValidEmail('user@.com')).toBe(false);
            expect(validators.isValidEmail('user@example.')).toBe(false);
            expect(validators.isValidEmail('@example.com')).toBe(false);
            expect(validators.isValidEmail('user example.com')).toBe(false);
        });

        test('should reject emails that are too long', () => {
            const longEmail = 'a'.repeat(247) + '@example.com'; // 256 chars total
            expect(validators.isValidEmail(longEmail)).toBe(false);
        });
    });

    describe('Academic Email Validation', () => {
        test('should validate Brazilian academic email domains', () => {
            expect(validators.isAcademicEmail('user@usp.br')).toBe(true);
            expect(validators.isAcademicEmail('user@ime.usp.br')).toBe(true);
            expect(validators.isAcademicEmail('user@unicamp.br')).toBe(true);
            expect(validators.isAcademicEmail('user@ic.unicamp.br')).toBe(true);
            expect(validators.isAcademicEmail('user@edu.br')).toBe(true);
        });

        test('should reject non-academic email domains', () => {
            expect(validators.isAcademicEmail('user@gmail.com')).toBe(false);
            expect(validators.isAcademicEmail('user@hotmail.com')).toBe(false);
            expect(validators.isAcademicEmail('user@outlook.com')).toBe(false);
            expect(validators.isAcademicEmail('user@yahoo.com.br')).toBe(false);
            expect(validators.isAcademicEmail('user@empresa.com.br')).toBe(false);
        });
    });

    describe('Password Strength Validation', () => {
        test('should validate strong passwords', () => {
            expect(validators.isStrongPassword('Abcd1234')).toBe(true);
            expect(validators.isStrongPassword('StrongP4ssword')).toBe(true);
            expect(validators.isStrongPassword('P4ssw0rd!')).toBe(true);
        });

        test('should reject weak passwords', () => {
            expect(validators.isStrongPassword('password')).toBe(false); // no uppercase, no numbers
            expect(validators.isStrongPassword('PASSWORD')).toBe(false); // no lowercase, no numbers
            expect(validators.isStrongPassword('12345678')).toBe(false); // no letters
            expect(validators.isStrongPassword('Pass1')).toBe(false); // too short
            expect(validators.isStrongPassword('passwordpassword')).toBe(false); // no uppercase, no numbers
        });
    });

    describe('Content Validation', () => {
        test('should validate valid titles', () => {
            expect(validators.isValidTitle('Valid Title')).toBe(true);
            expect(validators.isValidTitle('A slightly longer title that is still valid')).toBe(true);
        });

        test('should reject invalid titles', () => {
            expect(validators.isValidTitle('')).toBe(false); // empty
            expect(validators.isValidTitle('   ')).toBe(false); // only whitespace
            expect(validators.isValidTitle('Ab')).toBe(false); // too short
            expect(validators.isValidTitle(null)).toBe(false); // null
            expect(validators.isValidTitle(undefined)).toBe(false); // undefined
            expect(validators.isValidTitle(123)).toBe(false); // not a string
        });

        test('should validate valid content', () => {
            const validContent = 'A'.repeat(100);
            expect(validators.isValidContent(validContent)).toBe(true);

            const longerContent = 'A'.repeat(1000);
            expect(validators.isValidContent(longerContent)).toBe(true);
        });

        test('should reject invalid content', () => {
            expect(validators.isValidContent('')).toBe(false); // empty
            expect(validators.isValidContent('   ')).toBe(false); // only whitespace
            expect(validators.isValidContent('A'.repeat(99))).toBe(false); // too short
            expect(validators.isValidContent('A'.repeat(50001))).toBe(false); // too long
            expect(validators.isValidContent(null)).toBe(false); // null
            expect(validators.isValidContent(undefined)).toBe(false); // undefined
            expect(validators.isValidContent(123)).toBe(false); // not a string
        });
    });

    describe('Token Validation', () => {
        test('should validate valid tokens', () => {
            const validToken = 'a'.repeat(64);
            expect(validators.isValidToken(validToken)).toBe(true);

            const hexToken = '0123456789abcdef'.repeat(4);
            expect(validators.isValidToken(hexToken)).toBe(true);
        });

        test('should reject invalid tokens', () => {
            expect(validators.isValidToken('')).toBe(false); // empty
            expect(validators.isValidToken('a'.repeat(63))).toBe(false); // too short
            expect(validators.isValidToken('a'.repeat(65))).toBe(false); // too long
            expect(validators.isValidToken('invalid-token-with-non-hex-chars!')).toBe(false); // non-hex chars
            expect(validators.isValidToken(null)).toBe(false); // null
            expect(validators.isValidToken(undefined)).toBe(false); // undefined
            expect(validators.isValidToken(123)).toBe(false); // not a string
        });
    });

    describe('Sanitization', () => {
        test('should sanitize strings', () => {
            expect(validators.sanitizeString('<script>alert("XSS")</script>')).not.toContain('<script>');
            expect(validators.sanitizeString('  trim me  ')).toBe('trim me');
        });

        test('should handle non-string inputs', () => {
            expect(validators.sanitizeString(null)).toBe(null);
            expect(validators.sanitizeString(undefined)).toBe(undefined);
            expect(validators.sanitizeString(123)).toBe(123);
            expect(validators.sanitizeString({})).toEqual({});
        });
    });

    describe('Institution Validation', () => {
        test('should validate valid institutions', () => {
            expect(validators.isValidInstitution('Universidade de São Paulo')).toBe(true);
            expect(validators.isValidInstitution('')).toBe(true); // optional
            expect(validators.isValidInstitution(null)).toBe(true); // optional
            expect(validators.isValidInstitution(undefined)).toBe(true); // optional
        });

        test('should reject invalid institutions', () => {
            expect(validators.isValidInstitution('A'.repeat(201))).toBe(false); // too long
            expect(validators.isValidInstitution(123)).toBe(false); // not a string
        });
    });

    describe('Keywords Validation', () => {
        test('should validate valid keywords', () => {
            expect(validators.isValidKeywords(['keyword1', 'keyword2'])).toBe(true);
            expect(validators.isValidKeywords(['single'])).toBe(true);
            expect(validators.isValidKeywords([])).toBe(true); // empty array is valid
        });

        test('should reject invalid keywords', () => {
            expect(validators.isValidKeywords(null)).toBe(false); // not an array
            expect(validators.isValidKeywords('keywords')).toBe(false); // not an array
            expect(validators.isValidKeywords(['a'.repeat(51)])).toBe(false); // keyword too long
            expect(validators.isValidKeywords(['', 'keyword2'])).toBe(false); // empty keyword
            expect(validators.isValidKeywords([123, 'keyword2'])).toBe(false); // non-string keyword

            const tooManyKeywords = Array(11).fill('keyword');
            expect(validators.isValidKeywords(tooManyKeywords)).toBe(false); // too many keywords
        });
    });
});
