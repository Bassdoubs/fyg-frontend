/**
 * Formateur de nombres pour afficher les valeurs monétaires et numériques
 */
export const numberFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formatte un nombre en tant que valeur monétaire
 */
export const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

/**
 * Formatte un nombre avec des unités compactes (K, M, G)
 */
export const compactNumberFormatter = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  compactDisplay: 'short',
}); 