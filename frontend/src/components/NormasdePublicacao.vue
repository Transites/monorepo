<template>
    <div class="normasContainer" :style="{ padding: propPadding }">
      <v-card class="normasCard">
        <div class="normasContent">
          <h1 class="normasTitle"><b>Trânsitos</b> | <i>Circulations</i></h1>
          <p class="normasSubtitle"><b>Normas de Publicação</b></p>
  
          <!-- Texto principal -->
          <p class="normasText">
            <span>
              <b>Os verbetes terão no máximo 3 páginas, em Times New Roman 12, espaço 1,5. Não usar sublinhado.</b><br />
              O uso de aspas é restrito a títulos de artigos/capítulos, teses e dissertações, filmes, obras de teatro,
              música ou artes visuais. O itálico é restrito a títulos de livros e a palavras em língua estrangeira, quando isto for necessário (e com a tradução indicada em seguida, entre parênteses). Evitar citações e, se for indispensável, estas não devem ultrapassar duas linhas. As notas (de rodapé ou de fim) não são autorizadas. As pessoas citadas devem ter o nome completo (sem abreviações) seguido de parênteses com data de nascimento e morte no seguinte formato: (XXXX-XXXX). Se o autor considerar que as pessoas citadas merecem um verbete próprio, pedimos que dê destaque aos nomes em vermelho. Para siglas: na primeira menção, redigir por extenso, indicando, depois, a sigla, entre parênteses. Para as menções seguintes, utilizar somente a sigla.
            </span>
          </p>
  
          <!-- Cabeçalho -->
          <p class="normasText">
            <span>
              <b>1. O cabeçalho deve conter as seguintes informações, no formato indicado a seguir:</b><br />
              <br />
              <b> - Para verbetes de “pessoas”:</b><br />
              - Nome Sobrenome seguindo, se for o caso, em linha sucessivas, de variantes do nome/sobrenome
              <br />
              <b> - Para verbetes de “instituição”, “obra” ou “evento”:</b><br />
              - O nome exato da instituição por extenso e a sigla (se for o caso) entre parênteses em seguida. Se a instituição tiver um título em língua diferente daquela da redação do verbete, incluir a tradução entre colchetes.
              <br />
              - O nome da obra (se for livro em itálico, se for filme, peça de teatro, obra de arte visual ou musical, entre aspas). Se a obra
              tiver um título em língua diferente daquela da redação do verbete, incluir a tradução (já existente, se for o caso, ou dada pelo autor do verbete) entre colchetes.
              <br />
              - O título do evento por extenso e a sigla (se for o caso) entre parênteses em seguida. Se o evento tiver um título em língua diferente daquela da redação do verbete, incluir a tradução entre colchetes.
              <br />
              <b>- Três a cinco palavras chaves em linhas distintas (sem pontuação), da mais geral à mais específica (sem a indicação “palavras chaves”).</b><br /> Privilegiar dados profissionais/disciplinares (campo de atuação/domínio de especialidade) ou gênero, para obras.
              <br />
              <b> - Para verbetes de “pessoas”, nesta ordem (em linhas consecutivas):            </b><br />
              <br />
              - <b> O título do verbete: </b>nome completo da pessoa em questão, começando com o primeiro nome, sem abreviações.
              <br />
              - <b> Local e data de nascimento e morte no seguinte formato (em duas linhas, as datas em negrito, os locais, não): </b><br />
              - <b> DD/MM/AAAA</b>País / Estado (se for Brasil) / Cidade
              <br />
              <b> - Para verbetes de “instituição”, “grupo”, “obra” ou “evento”, “termo/conceito”: </b><br />
              - <b> O título do verbete: </b>nome completo da instituição, do grupo, da obra, do evento ou o termo/conceito em questão, por extenso sem qualquer abreviação.
              <br />
              - <b> Local e data:  </b><br /> para instituição, grupo ou evento vale o mesmo formato de “pessoa” se a cidade for informação cabível; o país sempre deve constar. Colocar as datas de início e fim (com dia e mês, quando relevante). 
              <br />
              - Para obra, em uma só linha, a data de criação e, caso o local seja conhecido, seguir o formato completo acima.
              <br />
              - Para termo/conceito: omitir este dado de tempo/espaço, mas inserir, eventualmente, a etimologia
              <br />
            </span>
          </p>
  
          <!-- Resumo -->
          <p class="normasText">
            <span>
              <b>2. Pular uma linha após o cabeçalho e redigir três linhas (no máximo) de resumo do objeto do verbete, sem indicar a palavra “resumo”.</b><br />
              O resumo deve ser objetivo e informativo, o mais sintético possível, para que o leitor possa perceber o conteúdo do verbete antes de prosseguir.
            </span>
          </p>
  
          <!-- ATENÇÃO -->
          <p class="normasText">
            <span>
              <b>3. ATENÇÃO:</b> o verbete não deve contar “tudo” de um percurso biográfico, uma instituição, uma obra ou um evento, mas deve ter, como fio condutor e raison d’être a relação com os trânsitos entre a França e o Brasil. este recorte deve estar claro, pois justifica a existência do verbete em nossa enciclopédia.<br />
            </span>
          </p>
  
          <!-- Modelo de verbete -->
          <p class="normasText">
            <span>
              <b>4. O modelo de nossos verbetes é um texto curto, enxuto, enriquecido pela dinâmica dada pelos “trânsitos”. Os autores devem evitar a adjetivação, priorizando um discurso direto e uma linguagem límpida e informativa. O jargão é proibido.</b><br /> 
              <br />
              - Descrever as principais realizações. No caso de o personagem ser um universitário, escritor, artista ou artesão, enumerar a sua produção e, para publicações, indicar sempre as primeiras edições e, se possível, as traduções publicadas no Brasil para obras francesas (e vice-versa para obras brasileiras). Para as traduções, indicar também, sempre, a primeira edição.
              <br />
              - Se for o caso, indicar todas as grafias do nome existentes.
              <br />
              - Realçar sua relação com a França e/ou Brasil e/ou sua memória: percurso, participação, ideias, etc. 
              <br />
              - Se for o caso, indicar também algum dado relevante acerca da memória ao redor do personagem, remetendo-o à posteridade. Se seu verbete tem relações com outros que também serão publicados (escritos por você ou não), aconselhamos que tenha isso em mente ao redigir seu texto, sugerindo links (nesse caso, sinalize com negrito). Caso tenha dúvidas, consulte-nos sobre eventuais outros verbetes.
              <br />
              <b> - Bibliografia utilizada:</b>Mencionar no máximo 5 obras de referência que permitam aprofundamento, ao final do verbete (vide padrão abaixo). 
              <br />
               - <b> IMPORTANTE:</b><br />
               - Todo verbete deve ser acompanhado de até três fotografias com legendas e créditos (no formato “Foto: nome do autor.”). As imagens devem ser enviadas à parte, em arquivos imagem (jpeg), alta definição e serem livres de direitos (ou terem os direitos concedidos em documento anexo ao envio). Além das fotografias, os verbetes também podem ser acompanhados de vídeos, caso existam.
              <br />
               - Incluir nome(s) do(s) autor(es) do verbete ao final (à direita), com uma indicação institucional direta como no modelo abaixo:
              <br />
              <br />
              José Antônio de Souza
              <br />
              Universidade de São Paulo (USP)
              <br />
            </span>
          </p>
  
          <!-- Bibliografia -->
          <p class="normasText">
            <span>
              <b>Padrão de indicação bibliográfica:</b><br />
              <b>Livro individual</b><br />
              LÉVI-STRAUSS, Claude. <i>Tristes tropiques</i>. Paris: Plon, Terre humaine, 1955. <br />
              <b>*Indicar nomes e sobrenomes por extenso, deixando iniciais somente para os casos em que o autor assim as utiliza.</b><br />
              <br />
              <b>Coletânea/dicionário</b><br />
              IZARD, Michel (org.). <i>Lévi-Strauss.</i> Cahier de l’Herne Paris: Editions de l’Herne, 2004. <br />  
              <br />
              <b>Artigo</b><br />
              STOCZKOWSKI, Wiktor. <i>“L’anthropologie rédemptrice de Claude Lévi-Strauss”.</i> Études, t. 412, n° 4, 2010, p. 485-495. DOI : 10.3917/etu.4124.0485. <br />  
              <br />
              <b>Capítulo</b><br />
              PEIXOTO, Fernanda Arêas. “Franceses e norte-americanos nas ciências sociais brasileiras (1930-1960)”. In MICELI, Sergio (org.). <i>História das ciências sociais no Brasil</i>, vol. I. São Paulo: Ed. Sumaré, 2001, p. 477-531. <br />  
              <br />
              <b>Tese/dissertação</b><br />
              FABRY, Lucie. “L’anthropologie comme science rigoureuse : une lecture épistémologique de l’œuvre de Claude Lévi-Strauss”. Paris : Université Paris sciences et lettres, 2021 (tese).<br />  
            </span>
          </p>
        </div>
      </v-card>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      propPadding: {
        default: '70px 5% 30px 5%'
      }
    },
  };
  </script>
  
  <style scoped>
  .normasContainer {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    background-color: var(--color-background-soft);
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    padding: var(--prop-padding);
  }
  
  .normasCard {
    border: var(--border-width) solid transparent;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  .normasContent {
    padding: 20px;
    text-align: justify;
  }
  
  .normasTitle {
    font-size: 28px;
    margin-bottom: 20px;
    color: var(--transites-light-red);
    text-align: center;
  }
  
  .normasSubtitle {
    color: var(--transites-light-red);
  }
  
  .normasText {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  </style>
  