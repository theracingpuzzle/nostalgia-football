import type { ClubListing } from './premierLeague0809';

/**
 * The 20 clubs of the 2008/09 La Liga season — the first league added
 * beyond the Premier League (see PLAN.md for the multi-league expansion).
 *
 * Same caveat as premierLeague0809.ts: reconstructed from memory, not a
 * verified source. The identity of the 20 clubs and the top/bottom-3
 * positions (champions Barcelona, relegated Real Betis/Numancia/
 * Recreativo Huelva) are solid; exact mid-table order is not guaranteed.
 * Colors/kitPattern are a best-effort real-identity fallback (e.g.
 * Málaga's blue/white halves, Barcelona's blaugrana stripes), not a
 * verified render of the actual 2008/09 shirt. Stadium names are real
 * grounds for that era; capacities are rounded approximations, same
 * spirit as premierLeague0809.ts, and lower-confidence for the smaller
 * clubs than for the well-known ones.
 *
 * Real crests sourced from Wikipedia (current club badges, not necessarily
 * 2008/09-era designs — same caveat already applied to the Premier League
 * crests). Private build only, not distributed — see .gitignore. Club ids
 * are prefixed `ll-` to guarantee no collision with any other league's ids.
 */
export const LA_LIGA_2008_09: ClubListing[] = [
  { id: 'll-real-madrid', name: 'Real Madrid', shortName: 'RMA', primaryColor: '#FFFFFF', secondaryColor: '#FEBE10', crestPath: 'crests/ll-real-madrid.svg', kitPattern: 'solid', stadiumName: 'Santiago Bernabéu', stadiumCapacity: 80000 },
  { id: 'll-barcelona', name: 'Barcelona', shortName: 'BAR', primaryColor: '#A50044', secondaryColor: '#004D98', crestPath: 'crests/ll-barcelona.svg', kitPattern: 'stripes', stadiumName: 'Camp Nou', stadiumCapacity: 98000 },
  { id: 'll-atletico-madrid', name: 'Atlético Madrid', shortName: 'ATM', primaryColor: '#CB3524', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-atletico-madrid.svg', kitPattern: 'stripes', stadiumName: 'Vicente Calderón', stadiumCapacity: 54000 },
  { id: 'll-valencia', name: 'Valencia', shortName: 'VAL', primaryColor: '#FFFFFF', secondaryColor: '#FF7F00', crestPath: 'crests/ll-valencia.svg', kitPattern: 'solid', stadiumName: 'Mestalla', stadiumCapacity: 55000 },
  { id: 'll-villarreal', name: 'Villarreal', shortName: 'VIL', primaryColor: '#FFE667', secondaryColor: '#004E98', crestPath: 'crests/ll-villarreal.svg', kitPattern: 'solid', stadiumName: 'El Madrigal', stadiumCapacity: 24500 },
  { id: 'll-sevilla', name: 'Sevilla', shortName: 'SEV', primaryColor: '#FFFFFF', secondaryColor: '#D2001C', crestPath: 'crests/ll-sevilla.png', kitPattern: 'solid', stadiumName: 'Ramón Sánchez Pizjuán', stadiumCapacity: 45500 },
  { id: 'll-deportivo', name: 'Deportivo La Coruña', shortName: 'DEP', primaryColor: '#0066B3', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-deportivo.svg', kitPattern: 'stripes', stadiumName: 'Riazor', stadiumCapacity: 32000 },
  { id: 'll-athletic-bilbao', name: 'Athletic Bilbao', shortName: 'ATH', primaryColor: '#EE2523', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-athletic-bilbao.svg', kitPattern: 'stripes', stadiumName: 'San Mamés', stadiumCapacity: 39750 },
  { id: 'll-mallorca', name: 'Mallorca', shortName: 'MLL', primaryColor: '#E2051B', secondaryColor: '#000000', crestPath: 'crests/ll-mallorca.svg', kitPattern: 'solid', stadiumName: 'Son Moix', stadiumCapacity: 23000 },
  { id: 'll-malaga', name: 'Málaga', shortName: 'MAL', primaryColor: '#0067B1', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-malaga.svg', kitPattern: 'halves', stadiumName: 'La Rosaleda', stadiumCapacity: 30000 },
  { id: 'll-racing-santander', name: 'Racing Santander', shortName: 'RAC', primaryColor: '#007A3D', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-racing-santander.svg', kitPattern: 'stripes', stadiumName: 'El Sardinero', stadiumCapacity: 22300 },
  { id: 'll-getafe', name: 'Getafe', shortName: 'GET', primaryColor: '#005BAA', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-getafe.png', kitPattern: 'solid', stadiumName: 'Coliseum Alfonso Pérez', stadiumCapacity: 17000 },
  { id: 'll-osasuna', name: 'Osasuna', shortName: 'OSA', primaryColor: '#D2001C', secondaryColor: '#071D49', crestPath: 'crests/ll-osasuna.svg', kitPattern: 'solid', stadiumName: 'El Sadar', stadiumCapacity: 19800 },
  { id: 'll-valladolid', name: 'Real Valladolid', shortName: 'VLL', primaryColor: '#5B2C86', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-valladolid.svg', kitPattern: 'solid', stadiumName: 'José Zorrilla', stadiumCapacity: 26600 },
  { id: 'll-espanyol', name: 'Espanyol', shortName: 'ESP', primaryColor: '#007FC8', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-espanyol.svg', kitPattern: 'stripes', stadiumName: 'Estadi Olímpic de Montjuïc', stadiumCapacity: 40500 },
  { id: 'll-sporting-gijon', name: 'Sporting Gijón', shortName: 'SPG', primaryColor: '#EE2E24', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-sporting-gijon.svg', kitPattern: 'stripes', stadiumName: 'El Molinón', stadiumCapacity: 29000 },
  { id: 'll-almeria', name: 'Almería', shortName: 'ALM', primaryColor: '#D2001C', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-almeria.svg', kitPattern: 'solid', stadiumName: 'Estadio del Mediterráneo', stadiumCapacity: 15000 },
  { id: 'll-real-betis', name: 'Real Betis', shortName: 'BET', primaryColor: '#00954C', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-real-betis.png', kitPattern: 'stripes', stadiumName: 'Benito Villamarín', stadiumCapacity: 52000 },
  { id: 'll-numancia', name: 'Numancia', shortName: 'NUM', primaryColor: '#D2001C', secondaryColor: '#002E62', crestPath: 'crests/ll-numancia.svg', kitPattern: 'solid', stadiumName: 'Los Pajaritos', stadiumCapacity: 9000 },
  { id: 'll-recreativo-huelva', name: 'Recreativo Huelva', shortName: 'REC', primaryColor: '#004899', secondaryColor: '#FFFFFF', crestPath: 'crests/ll-recreativo-huelva.svg', kitPattern: 'stripes', stadiumName: 'Nuevo Colombino', stadiumCapacity: 21000 },
];
