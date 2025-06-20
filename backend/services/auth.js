const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../middleware/logging');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET;
        this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET environment variable is required');
        }

        if (this.jwtSecret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters long');
        }
    }

    /**
     * Hash de senha com bcrypt
     */
    async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(this.saltRounds);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            logger.error('Password hashing error', { error: error.message });
            throw new Error('Erro ao processar senha');
        }
    }

    /**
     * Comparar senha com hash
     */
    async comparePassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('Password comparison error', { error: error.message });
            return false;
        }
    }

    /**
     * Gerar token JWT
     */
    generateJWT(payload, expiresIn = '24h') {
        try {
            const tokenPayload = {
                ...payload,
                iat: Math.floor(Date.now() / 1000),
                jti: crypto.randomUUID() // JWT ID for tracking
            };

            const options = {
                expiresIn,
                issuer: 'enciclopedia-transitos',
                audience: 'admin',
                algorithm: 'HS256'
            };

            return jwt.sign(tokenPayload, this.jwtSecret, options);
        } catch (error) {
            logger.error('JWT generation error', { error: error.message });
            throw new Error('Erro ao gerar token');
        }
    }

    /**
     * Verificar e decodificar token JWT
     */
    verifyJWT(token) {
        const options = {
            issuer: 'enciclopedia-transitos',
            audience: 'admin',
            algorithms: ['HS256']
        };

        return jwt.verify(token, this.jwtSecret, options);
    }

    /**
     * Extrair token do header Authorization
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }

    /**
     * Gerar par de tokens (access + refresh)
     */
    generateTokenPair(payload, rememberMe = false) {
        const accessToken = this.generateJWT(payload, '24h');
        const refreshPayload = {
            id: payload.id,
            type: 'refresh'
        };
        const refreshToken = this.generateJWT(refreshPayload, rememberMe ? '30d' : '7d');

        return {
            accessToken,
            refreshToken,
            accessExpiresIn: '24h',
            refreshExpiresIn: rememberMe ? '30d' : '7d'
        };
    }

    /**
     * Validar força da senha
     */
    validatePasswordStrength(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Senha deve ter pelo menos 8 caracteres');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra minúscula');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra maiúscula');
        }

        if (!/\d/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Senha deve conter pelo menos um caractere especial');
        }

        // Verificar senhas comuns
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];

        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Senha muito comum, escolha uma mais segura');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Gerar token seguro para reset de senha
     */
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Calcular tempo até expiração do token
     */
    getTokenTimeToExpiry(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return null;
            }

            const expiryTime = decoded.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeToExpiry = expiryTime - currentTime;

            return timeToExpiry > 0 ? timeToExpiry : 0;
        } catch (error) {
            return null;
        }
    }

    /**
     * Verificar se token está próximo do vencimento
     */
    isTokenNearExpiry(token, thresholdMinutes = 60) {
        const timeToExpiry = this.getTokenTimeToExpiry(token);
        if (timeToExpiry === null) {
            return true; // Se não conseguir verificar, considerar próximo do vencimento
        }

        const thresholdMs = thresholdMinutes * 60 * 1000;
        return timeToExpiry <= thresholdMs;
    }
}

module.exports = new AuthService();
