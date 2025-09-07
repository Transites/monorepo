export default function TeamSection() {
  return (
    <section id="sobre-nos" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Quem somos
          </h2>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Coordinators */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Coordenadores
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Marisa Midori Deaecto (USP), Mônica Raisa Schpun (EHESS), Olival Freire Jr. (UFBA) e
              Alfredo Goldman (USP)
            </p>
          </div>

          {/* Team */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Equipe
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Ana Fernandes (UFBA), Antonio Augusto Passos Videira (UERJ), Antonio Dimas (USP), Antonio Mota (
              Unifesp), Camila Gui Rosatti (EHESS), Carolina Queiroz (UFRB), Eduardo Paschoal de Sousa (USP), Elisabeth Azevedo (USP),
              Fabiana Marchetti (Unesp), François-Michel Le Tourneau (CNRS), Felipe Azevedo (USP), Fernanda Azeredo de Moraes (EHESS),
              Gilberto Hochman (Fiocruz), Hervé Théry (CNRS), Hugo Quinta (USP), Luciana Vieira Souza da Silva (MAST), Magali Sá (
              Fiocruz), Márcia Aguiar (Unifesp), Patrick Petitjean (Université Paris Cité), Regina Campos (USP), Rodrigo Nabuco de
              Araújo (Université Paris 1 Panthéon-Sorbonne), Taísa Palhares (Unicamp), Tânia de Luca (Unesp)
            </p>
          </div>

          {/* Development */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Desenvolvimento
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground">
              O site foi desenvolvido pelos alunos do curso de Matemática Aplicada Gyovanna Marques Kwasinei e Gustavo Araújo, sob a
              orientação de Alfredo Goldman (USP).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}