# General task

Update home page elements.

# Sub-tasks

1. T1: Update texts.
2. T2: Add categories.
3. T3: Replace two cards of the "Sobre o projeto Transitos" section with a text row. The "Saiba mais" button will still
   be there, but, when clicked, it will open content down and even scroll the user if necessary to show the rest of the
   content.
4. T4: New "Sobre nós" section below the "Saiba mais" section.
5. T5: "Links úteis" section at the bottom of the page should be updated to "Links importantes" and updated to reference
   the existing sections of the home page. If the section don't exist yet, give some visual cue that it is not
   available.
6. T6: The Transitos at the bottom should have the logo at its side as well.

## Diving into sub-tasks specification

### T1: Update texts

1. Above the title "Enciclopedia Digital dos ..." we should have "Trânsitos | Circulations" in a beautiful red.
2. Title should be changed to "Enciclopedia Digital das <darkpink>Relações Brasil-França</darkpink> <darkyellow>(
   1880-1990)</darkyellow>". Interpret the color tags as the color these parts should have.

### T2: Add categories

1. We need new categories: "Agrupamentos", "Conceitos". Agrupamentos should be green and Conceitos should be yellow.
2. We need to replace the "Organização" with "Instituições". "Organização" should keep the color of "Instituições".

### T3: Replace two cards of the "Sobre o projeto Transitos" section with a text row

1. Text row before clicking "Saiba mais":
   "Trânsitos|Circulations é uma enciclopédia digital, interativa e bilíngue que se destina a mapear, sistematizar e
   fomentar pesquisas sobre as relações franco-brasileiras, com enfoque em <magenta>pessoas</magenta>, <purple>
   obras</purple>, <blue>instituições</blue>, <cyan>empresas</cyan>, <green>agrupamentos</green>, <lime>eventos</lime>
   e <yellow>conceitos</yellow>, no período de 1880 a 1990...
2. Text row after clicking "Saiba mais":
   "Pessoas, grupos e obras circularam nos dois sentidos do Atlântico. São os trânsitos que buscamos recuperar e os
   movimentos que entendemos redesenhar, em diferentes esferas
   da sociedade, desde as cooperações intelectuais, científicas e artísticas até, ou principalmente, as migrações
   motivadas por questões econômicas, políticas ou religiosas. A Enciclopédia tem duplo propósito: a) desenvolver
   trabalhos inéditos, a partir de uma abordagem transdisciplinar; b) refletir sobre os usos da tecnologia para a
   pesquisa, mas também desenvolver ferramentas próprias que potencializam as bases de dados e a interação com os
   leitores."

### T4: New "Sobre nós" section below the "Saiba mais" section

Use the following as reference, but, only implement in Portuguese.

Quem somos | Qui sommes-nous
Coordenadores | Coordinateurs : Marisa Midori Deaecto (USP), Mônica Raisa Schpun (EHESS), Olival Freire Jr. (UFBA) e
Alfredo Goldman (USP)
Equipe | Équipe : Ana Fernandes (UFBA), Antonio Augusto Passos Videira (UERJ), Antonio Dimas (USP), Antonio Mota (
Unifesp), Camila Gui Rosatti (EHESS), Carolina Queiroz (UFRB), Eduardo Paschoal de Sousa (USP), Elisabeth Azevedo (USP),
Fabiana Marchetti (Unesp), François-Michel Le Tourneau (CNRS), Felipe Azevedo (USP), Fernanda Azeredo de Moraes (EHESS),
Gilberto Hochman (Fiocruz), Hervé Théry (CNRS), Hugo Quinta (USP), Luciana Vieira Souza da Silva (MAST), Magali Sá (
Fiocruz), Márcia Aguiar (Unifesp), Patrick Petitjean (Université Paris Cité), Regina Campos (USP), Rodrigo Nabuco de
Araújo (Université Paris 1 Panthéon-Sorbonne), Taísa Palhares (Unicamp), Tânia de Luca (Unesp)
O site foi desenvolvido pelos alunos do curso de Matemática Aplicada Gyovanna Marques Kwasinei e Gustavo Araújo, sob a
orientação de Alfredo Goldman (USP).
Le site a été développé par les étudiants en mathématiques appliquées Gyovanna Marques Kwasinei et Gustavo Araújo, sous
la direction d’Alfredo Goldman (USP).

### T5: "Links úteis" section at the bottom of the page should be updated to "Links importantes"

"Links úteis" section at the bottom of the page should be updated to "Links importantes" and updated to reference
the existing sections of the home page. If the section don't exist yet, give some visual cue that it is not
available.

### T6: The Transitos at the bottom should have the logo at its side as well.

Self-explanatory.

## Development flow
Check if frontend is running at http://localhost:8080 and backend at http://localhost:1337/api.

1. Implement.
2. Review with Playwright.
3. Ask user to review.
4. If accepted, commit.
5. Append knowledge to a documentation file for this update.
6. Proceed to the next task.
7. If any sub-task is too complex, break it down into smaller sub-tasks and use sub-agents if still too complex or
   context-heavy.