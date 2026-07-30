const { validationResult } = require('express-validator');
// Ajuste o caminho abaixo para onde o seu arquivo compilado (ou JS) está localizado
// Dependendo de como o seu projeto transpila, pode ser necessário usar `.default` no final
const submissionValidators = require('../../validators/submission').default || require('../../validators/submission'); 

// Função auxiliar para rodar os validadores em um mock de Request
const validate = async (req, validators) => {
    for (const validator of validators) {
        await validator.run(req);
    }
    return validationResult(req);
};

describe('Submission Validators - validateCompleteness', () => {
    // Objeto padrão com todos os dados válidos para facilitar os testes
    const validData = {
        title: 'Um título de artigo válido',
        summary: 'A'.repeat(50), // 50 caracteres
        content: 'B'.repeat(100), // 100 caracteres
        category: 'ARTICLE',
        keywords: ['tecnologia', 'inovação']
    };

    it('deve passar na validação quando todos os dados estão corretos via req.body', async () => {
        const req = { body: { ...validData } };
        const result = await validate(req, submissionValidators.validateCompleteness);
        
        expect(result.isEmpty()).toBe(true);
    });

    it('deve passar na validação quando os dados estão no req.submission (fallback)', async () => {
        const req = { 
            body: {}, 
            submission: { ...validData } 
        };
        const result = await validate(req, submissionValidators.validateCompleteness);
        
        expect(result.isEmpty()).toBe(true);
    });

    it('deve falhar se o título for ausente ou menor que 5 caracteres', async () => {
        const reqMissing = { body: { ...validData, title: undefined } };
        const reqShort = { body: { ...validData, title: '1234' } };

        const resultMissing = await validate(reqMissing, submissionValidators.validateCompleteness);
        const resultShort = await validate(reqShort, submissionValidators.validateCompleteness);

        expect(resultMissing.array()[0].msg).toBe('Título deve ter pelo menos 5 caracteres');
        expect(resultShort.array()[0].msg).toBe('Título deve ter pelo menos 5 caracteres');
    });

    it('deve falhar se o resumo for ausente ou menor que 50 caracteres', async () => {
        const reqMissing = { body: { ...validData, summary: undefined } };
        const reqShort = { body: { ...validData, summary: 'Resumo muito curto' } };

        const resultMissing = await validate(reqMissing, submissionValidators.validateCompleteness);
        const resultShort = await validate(reqShort, submissionValidators.validateCompleteness);

        expect(resultMissing.array()[0].msg).toBe('Resumo deve ter pelo menos 50 caracteres');
        expect(resultShort.array()[0].msg).toBe('Resumo deve ter pelo menos 50 caracteres');
    });

    it('deve falhar se o conteúdo for ausente ou menor que 100 caracteres', async () => {
        const reqMissing = { body: { ...validData, content: undefined } };
        const reqShort = { body: { ...validData, content: 'Conteúdo curto' } };

        const resultMissing = await validate(reqMissing, submissionValidators.validateCompleteness);
        const resultShort = await validate(reqShort, submissionValidators.validateCompleteness);

        expect(resultMissing.array()[0].msg).toBe('Conteúdo deve ter pelo menos 100 caracteres');
        expect(resultShort.array()[0].msg).toBe('Conteúdo deve ter pelo menos 100 caracteres');
    });

    it('deve falhar se a categoria for ausente', async () => {
        const req = { body: { ...validData, category: undefined } };
        const result = await validate(req, submissionValidators.validateCompleteness);

        expect(result.array()[0].msg).toBe('Categoria é obrigatória');
    });

    it('deve falhar se keywords for ausente, não for array ou estiver vazio', async () => {
        const reqMissing = { body: { ...validData, keywords: undefined } };
        const reqNotArray = { body: { ...validData, keywords: 'palavra-chave' } };
        const reqEmptyArray = { body: { ...validData, keywords: [] } };

        const resultMissing = await validate(reqMissing, submissionValidators.validateCompleteness);
        const resultNotArray = await validate(reqNotArray, submissionValidators.validateCompleteness);
        const resultEmptyArray = await validate(reqEmptyArray, submissionValidators.validateCompleteness);

        expect(resultMissing.array()[0].msg).toBe('Pelo menos 1 palavra-chave é obrigatória');
        expect(resultNotArray.array()[0].msg).toBe('Pelo menos 1 palavra-chave é obrigatória');
        expect(resultEmptyArray.array()[0].msg).toBe('Pelo menos 1 palavra-chave é obrigatória');
    });
});