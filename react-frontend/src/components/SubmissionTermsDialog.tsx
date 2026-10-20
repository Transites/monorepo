import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SubmissionTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

export const SUBMISSION_TERMS_AGREEMENT_LABEL = 'Li e concordo';

export const SUBMISSION_TERMS_TEXT = `Projeto

Manual

Os verbetes terão no máximo 8.000 caracteres (espaços incluídos). Não usar sublinhado. O uso de aspas é restrito a títulos de artigos/capítulos, teses e dissertações, filmes, obras de teatro, música ou artes visuais. O itálico é restrito a títulos de livros e a palavras em língua estrangeira, quando isto for necessário (e com a tradução indicada em seguida, entre parênteses). Evitar citações e, se for indispensável, estas não devem ultrapassar duas linhas. As notas (de rodapé ou de fim) não são autorizadas.

1. O cabeçalho deve conter as seguintes informações, no formato indicado a seguir:

- Para verbetes de “pessoas”:
  - Nome Sobrenome seguindo, se for o caso, em linha sucessivas, de variantes do Nome/Sobrenome

- Para verbetes de “instituição”, “empresa”, “agrupamento”, “evento” ou “obra”:
  - O nome exato da instituição, empresa, agrupamento, evento por extenso e a sigla (se for o caso) entre parênteses em seguida. Se a instituição, empresa, agrupamento tiver um título em língua diferente daquela da redação do verbete, incluir a tradução entre colchetes.
  - O nome da obra (se for livro em itálico, se for filme, peça de teatro, obra de arte visual ou musical, entre aspas). Se a obra tiver um título em língua diferente daquela da redação do verbete, incluir a tradução (já existente, se for o caso, ou dada pelo autor do verbete) entre colchetes.

Para verbetes de “conceito”:
- Indicar o conceito e, caso existam apelações próximas, variantes, colocá-los entre parênteses a seguir. Se o conceito tiver uma versão em língua diferente daquela da redação do verbete, incluir a tradução entre colchetes.
- Três a seis palavras de “ocupação”, da mais geral à mais específica, desenhando o campo profissional e de especialização da “pessoa”, “instituição”, “empresa”, “agrupamento”, “evento” ou “obra”.
- Três a seis palavras chaves (sem pontuação), da mais geral à mais específica. Informações geográficas e temporais devem ser utilizadas aqui, além de dados profissionais/disciplinares (campo de atuação/domínio de especialidade) ou gênero, para obras.

- Para verbetes de “pessoas”:
  - Local e data de nascimento e morte no seguinte formato:
    Nascimento: DD [sem inserir “zero” à esquerda] de mês [por extenso] de ANO, Cidade (sigla do estado, se for no Brasil), País
    Morte: DD [sem inserir “zero” à esquerda] de mês [por extenso] de ANO, Cidade (sigla do estado, se for no Brasil), País

- Para verbetes de “instituição”, “empresa”, “agrupamento”, “evento” ou “obra”:
  - No mesmo formato acima, data de início e fim (instituição, agrupamento ou evento); para empresa, data de fundação, sempre, e de fechamento se não existir mais; para obra, em uma só linha a data criação da obra (caso o local seja conhecido, seguir o formato completo acima).

1. Redigir um resumo de 500 caracteres (no máximo), espaços incluídos.

O resumo deve ser objetivo e informativo, o mais sintético possível, para que o leitor possa perceber o conteúdo do verbete antes de prosseguir.

1. ATENÇÃO: o verbete não deve contar “tudo” de um percurso biográfico, uma instituição, uma obra ou um evento, mas deve ter, como fio condutor e raison d’être a relação com os trânsitos entre a França e o Brasil. este recorte deve estar claro, pois justifica a existência do verbete em nossa enciclopédia.

1. Cada verbete deve ter no máximo 8.000 caracteres, incluindo espaços.

1. O modelo de nossos verbetes é um texto curto, enxuto, enriquecido pela dinâmica dada pelos “trânsitos”. Os autores devem evitar a adjetivação, priorizando um discurso direto e uma linguagem límpida e informativa. O jargão é proibido.

- Descrever as principais realizações. No caso de o personagem ser um universitário, escritor, artista ou artesão, enumerar a sua produção e, para publicações, indicar sempre as primeiras edições e, se possível, as traduções publicadas no Brasil para obras francesas (e vice-versa para obras brasileiras). Para as traduções, indicar também, sempre, a primeira edição.

- Se for o caso, indicar todas as grafias do nome existentes.

- Realçar sua relação com a França e/ou Brasil e/ou sua memória: percurso, participação, ideias, etc.

- Se for o caso, indicar também algum dado relevante acerca da memória ao redor do personagem, remetendo-o à posteridade. Se seu verbete tem relações com outros que também serão publicados (escritos por você ou não), aconselhamos que tenha isso em mente ao redigir seu texto, sugerindo links (nesse caso, sinalize com negrito). Caso tenha dúvidas, consulte-nos sobre eventuais outros verbetes.

- Bibliografia utilizada: mencionar no máximo 5 obras de referência que permitam aprofundamento, ao final do verbete (vide padrão abaixo).

- Obra: se a pessoa, o agrupamento, a instituição objeto do verbete tiver uma obra escrita/publicada, inserir as referências mais importantes no espaço “Obra”.

- Caso existam fontes arquivísticas importantes, referenciar de modo completo no espaço “Fontes”.

- IMPORTANTE: todo verbete deve ser acompanhado de ao menos uma fotografia com legenda e crédito. A imagem deve ser enviada à parte, em arquivo imagem (jpeg), alta definição e ser livre de direitos (ou ter os direitos concedidos em documento anexo ao envio).

- Incluir nome(s) do(s) autor(es) do verbete ao final (à direita), com uma indicação institucional direta como no modelo abaixo:

José Antônio de Souza

Universidade de São Paulo

Padrão de indicação bibliográfica:

Livro individual

LÉVI-STRAUSS, Claude. Tristes tropiques. Paris: Plon, Terre humaine, 1955.

* Indicar nomes e sobrenomes por extenso, deixando iniciais somente para os casos em que o autor assim as utiliza.

Coletânea/dicionário

IZARD, Michel (org.). Lévi-Strauss. Cahier de l’Herne Paris: Editions de l’Herne, 2004.

Artigo

[STOCZKOWSKI], [Wiktor.] “L’anthropologie rédemptrice de Claude Lévi-Strauss”. Études, t. 412, n° 4, 2010, p. 485-495. DOI: 10.3917/etu.4124.0485.

Capítulo

PEIXOTO, Fernanda Arêas. “Franceses e norte-americanos nas ciências sociais brasileiras (1930-1960)”. In MICELI, Sergio (org.). História das ciências sociais no Brasil, vol. I. São Paulo: Ed. Sumaré, 2001, p. 477-531.

Tese/dissertação

FABRY, Lucie. “L’anthropologie comme science rigoureuse : une lecture épistémologique de l’œuvre de Claude Lévi-Strauss”. Paris : Université Paris sciences et lettres, 2021 (tese).
`;

function TermsContent() {
  const blocks = SUBMISSION_TERMS_TEXT.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-5 text-sm leading-7 text-slate-700">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Projeto</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Trânsitos | Circulations</h3>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Enciclopédia Digital das Relações Brasil-França (1880-1990)
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Coordenadores:</span>{' '}
          Marisa Midori Deaecto, Mônica Raisa Schpun e Olival Freire Jr.
        </div>
      </div>

      {blocks.slice(1).map((block, index) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines[0] === 'Manual') {
          return <h4 key={index} className="mt-2 text-lg font-semibold text-slate-900">Manual</h4>;
        }

        if (lines[0]?.startsWith('ATENÇÃO:')) {
          return (
            <div key={index} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Atenção</p>
              <p className="leading-7">{lines.join(' ')}</p>
            </div>
          );
        }

        if (lines[0]?.startsWith('IMPORTANTE:')) {
          return (
            <div key={index} className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">Importante</p>
              <p className="leading-7">{lines.join(' ')}</p>
            </div>
          );
        }

        if (lines[0] === 'Padrão de indicação bibliográfica:') {
          return (
            <div key={index} className="mt-6 space-y-3">
              <h4 className="text-base font-semibold text-slate-900">Padrão de indicação bibliográfica</h4>
              <div className="space-y-3">
                {lines.slice(1).map((line, lineIndex) => (
                  <p key={`${index}-${lineIndex}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        }

        if (lines.some((line) => line.startsWith('- ') || line.startsWith('• '))) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-slate-700">
              {lines.map((line, lineIndex) => (
                <li key={`${index}-${lineIndex}`} className="leading-7">{line.replace(/^[-•]\s*/, '')}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="leading-7 text-slate-700">
            {lines.join(' ')}
          </p>
        );
      })}
    </div>
  );
}

export function SubmissionTermsDialog({ open, onOpenChange, onAgree }: SubmissionTermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
        <div className="max-h-[88vh] overflow-y-auto px-5 py-5 sm:px-7">
          <DialogHeader className="mb-4 border-b border-slate-200 pb-4">
            <DialogTitle className="text-left text-xl font-semibold text-slate-900">Termo de submissão do verbete</DialogTitle>
            <DialogDescription className="text-left text-sm text-slate-600">
              Leia o manual editorial antes de enviar ou editar um verbete.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
            <TermsContent />
          </div>

          <DialogFooter className="mt-5 flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onAgree();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto"
            >
              {SUBMISSION_TERMS_AGREEMENT_LABEL}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
