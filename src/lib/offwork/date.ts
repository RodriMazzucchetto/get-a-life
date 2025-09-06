// Helpers para manipulação de datas na funcionalidade Off Work

/**
 * Calcula o início da semana (segunda-feira) para uma data específica
 * @param date Data de referência
 * @param timezone Timezone (padrão: America/Sao_Paulo)
 * @returns Data da segunda-feira no formato YYYY-MM-DD
 */
export function getWeekStart(date: Date = new Date(), timezone: string = 'America/Sao_Paulo'): string {
  // Criar uma data no timezone especificado
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  
  // Encontrar a segunda-feira (0 = domingo, 1 = segunda)
  const dayOfWeek = localDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  // Calcular a segunda-feira
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + daysToMonday);
  
  // Retornar no formato YYYY-MM-DD
  return monday.toISOString().split('T')[0];
}

/**
 * Gera os 7 dias da semana a partir da segunda-feira
 * @param weekStart Data da segunda-feira (YYYY-MM-DD)
 * @returns Array com os 7 dias da semana
 */
export function getWeekDays(weekStart: string): string[] {
  const startDate = new Date(weekStart);
  const days: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date.toISOString().split('T')[0]);
  }
  
  return days;
}

/**
 * Formata uma data para exibição (ex: "Seg 08", "Ter 09")
 * @param date Data no formato YYYY-MM-DD
 * @param timezone Timezone para formatação
 * @returns String formatada
 */
export function formatDayLabel(date: string, timezone: string = 'America/Sao_Paulo'): string {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const d = new Date(date + 'T00:00:00');
  const localDate = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
  
  const dayName = dayNames[localDate.getDay()];
  const dayNumber = localDate.getDate().toString().padStart(2, '0');
  
  return `${dayName} ${dayNumber}`;
}

/**
 * Formata uma data para exibição curta (ex: "08", "09")
 * @param date Data no formato YYYY-MM-DD
 * @param timezone Timezone para formatação
 * @returns String formatada
 */
export function formatDayShort(date: string, timezone: string = 'America/Sao_Paulo'): string {
  const d = new Date(date + 'T00:00:00');
  const localDate = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
  
  return localDate.getDate().toString().padStart(2, '0');
}

/**
 * Verifica se uma data é hoje
 * @param date Data no formato YYYY-MM-DD
 * @param timezone Timezone para comparação
 * @returns true se for hoje
 */
export function isToday(date: string, timezone: string = 'America/Sao_Paulo'): boolean {
  const today = new Date();
  const todayStr = getWeekStart(today, timezone);
  const weekDays = getWeekDays(todayStr);
  
  return weekDays.includes(date);
}

/**
 * Verifica se uma data é no passado
 * @param date Data no formato YYYY-MM-DD
 * @param timezone Timezone para comparação
 * @returns true se for no passado
 */
export function isPastDate(date: string, timezone: string = 'America/Sao_Paulo'): boolean {
  const today = new Date();
  const todayStr = getWeekStart(today, timezone);
  const weekDays = getWeekDays(todayStr);
  
  const todayIndex = weekDays.findIndex(d => d === todayStr);
  const dateIndex = weekDays.findIndex(d => d === date);
  
  return dateIndex < todayIndex;
}
