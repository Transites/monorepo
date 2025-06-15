const validator = require('validator');

class Validators {
    // Email validation
    isValidEmail(email) {
        return validator.isEmail(email) && email.length <= 255;
    }

    // Brazilian academic email domains
    isAcademicEmail(email) {
        const academicDomains = [
            'usp.br', 'unicamp.br', 'ufrj.br', 'ufmg.br', 'ufsc.br',
            'puc-rio.br', 'fgv.br', 'edu.br'
        ];
        const domain = email.split('@')[1];
        return academicDomains.some(acadDomain =>
            domain === acadDomain || domain.endsWith('.' + acadDomain)
        );
    }

    // Password strength validation
    isStrongPassword(password) {
        return validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0
        });
    }

    // Content validation
    isValidTitle(title) {
        return title &&
               typeof title === 'string' &&
               title.trim().length >= 5 &&
               title.length <= 200;
    }

    isValidContent(content) {
        return content &&
               typeof content === 'string' &&
               content.trim().length >= 100 &&
               content.length <= 50000;
    }

    // Token validation
    isValidToken(token) {
        return token &&
               typeof token === 'string' &&
               token.length === 64 &&
               /^[a-f0-9]+$/.test(token);
    }

    // Sanitization
    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return validator.escape(str.trim());
    }

    // Institution validation
    isValidInstitution(institution) {
        return !institution ||
               (typeof institution === 'string' &&
                institution.trim().length <= 200);
    }

    // Keywords validation
    isValidKeywords(keywords) {
        return Array.isArray(keywords) &&
               keywords.length <= 10 &&
               keywords.every(keyword =>
                   typeof keyword === 'string' &&
                   keyword.trim().length > 0 &&
                   keyword.length <= 50
               );
    }
}

module.exports = new Validators();
