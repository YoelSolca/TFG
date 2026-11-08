namespace Backend.Domain.Entities
{
    public class IntervencionTipoDificultad
    {
        private IntervencionTipoDificultad() { }

        // Se crea desde la intervención, que le pone su id al guardarse.
        internal IntervencionTipoDificultad(int tipoDificultadId) => TipoDificultadId = tipoDificultadId;

        public int IntervencionId { get; private set; }
        public Intervencion Intervencion { get; private set; } = null!;
        public int TipoDificultadId { get; private set; }
        public TipoDificultad TipoDificultad { get; private set; } = null!;
    }
}
