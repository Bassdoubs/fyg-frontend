export const getAirportCardStyles = (airport: string) => {
  const colors = [
    'from-blue-500/10 to-blue-600/10 shadow-blue-500/20',
    'from-emerald-500/10 to-emerald-600/10 shadow-emerald-500/20',
    'from-violet-500/10 to-violet-600/10 shadow-violet-500/20',
    'from-amber-500/10 to-amber-600/10 shadow-amber-500/20',
    'from-rose-500/10 to-rose-600/10 shadow-rose-500/20',
    'from-indigo-500/10 to-indigo-600/10 shadow-indigo-500/20'
  ];
  const index = airport.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}; 