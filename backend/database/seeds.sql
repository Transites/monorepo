-- ===============================================
-- DADOS DE TESTE
-- ===============================================

-- Admin padrão para desenvolvimento
-- Senha: admin123
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO admins (email, password_hash, name) VALUES
('admin@enciclopedia.iea.usp.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2ukWJLTrB2', 'Administrador Principal'),
('monica@iea.usp.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2ukWJLTrB2', 'Monica Schpun'),
('marisa@iea.usp.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2ukWJLTrB2', 'Marisa Midori');

-- Submissões de exemplo em diferentes estados
INSERT INTO submissions (
    token, status, author_name, author_email, title, summary, content, keywords, category
) VALUES
(
    'draft_' || encode(gen_random_bytes(30), 'hex'),
    'DRAFT',
    'João Silva',
    'joao.silva@usp.br',
    'Influência Cultural Francesa no Brasil Colonial',
    'Análise da penetração cultural francesa durante o período colonial brasileiro.',
    'Este artigo examina as diversas formas de influência cultural francesa no Brasil colonial, desde as missões jesuíticas até os movimentos artísticos...',
    ARRAY['cultura', 'frança', 'brasil', 'colonial'],
    'História'
),
(
    'review_' || encode(gen_random_bytes(29), 'hex'),
    'UNDER_REVIEW',
    'Maria Santos',
    'maria.santos@unicamp.br',
    'A Filosofia Francesa e o Iluminismo Brasileiro',
    'Como as ideias iluministas francesas influenciaram o pensamento brasileiro.',
    'O Iluminismo francês teve profundo impacto no desenvolvimento intelectual brasileiro. Este estudo analisa as principais correntes...',
    ARRAY['filosofia', 'iluminismo', 'frança', 'brasil'],
    'Filosofia'
),
(
    'changes_' || encode(gen_random_bytes(28), 'hex'),
    'CHANGES_REQUESTED',
    'Pedro Costa',
    'pedro.costa@ufrj.br',
    'Relações Diplomáticas França-Brasil no Século XIX',
    'Análise das relações diplomáticas entre França e Brasil durante o século XIX.',
    'As relações diplomáticas entre França e Brasil no século XIX foram marcadas por diversos eventos importantes...',
    ARRAY['diplomacia', 'frança', 'brasil', 'século-xix'],
    'Relações Internacionais'
),
(
    'approved_' || encode(gen_random_bytes(28), 'hex'),
    'APPROVED',
    'Ana Oliveira',
    'ana.oliveira@ufmg.br',
    'Literatura Francesa e Suas Influências no Modernismo Brasileiro',
    'Como a literatura francesa influenciou o movimento modernista no Brasil.',
    'O modernismo brasileiro teve importantes influências da literatura francesa contemporânea. Este artigo explora essas conexões...',
    ARRAY['literatura', 'modernismo', 'frança', 'brasil'],
    'Literatura'
);

-- Artigos publicados de exemplo
INSERT INTO articles (submission_id, slug, title, summary, content, keywords, category)
SELECT
    s.id,
    'literatura-francesa-modernismo-brasileiro',
    s.title,
    s.summary,
    s.content,
    s.keywords,
    s.category
FROM submissions s
WHERE s.status = 'APPROVED'
LIMIT 1;

-- Feedback de exemplo
INSERT INTO feedback (submission_id, admin_id, content, section)
SELECT
    s.id,
    a.id,
    'Seria interessante expandir mais a seção sobre as influências específicas dos autores franceses. Adicione referências bibliográficas mais detalhadas.',
    'bibliografia'
FROM submissions s, admins a
WHERE s.status = 'CHANGES_REQUESTED'
AND a.email = 'monica@iea.usp.br'
LIMIT 1;

-- Atualizar status dos artigos publicados
UPDATE submissions SET status = 'PUBLISHED'
WHERE id IN (SELECT submission_id FROM articles);
