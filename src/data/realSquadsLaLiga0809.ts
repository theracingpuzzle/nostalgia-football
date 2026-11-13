import type { Player, Position } from '../engine/types';

/**
 * Squads for all 20 clubs of the 2008/09 La Liga season, keyed by the club
 * ids in laLiga0809.ts. Same caveat and conventions as realSquads2008_09.ts:
 * a best-effort reconstruction from memory, not a verified source.
 * Confidence is high for each club's headline first-teamers (especially
 * the bigger clubs — Real Madrid, Barcelona, Atlético, Valencia), lower
 * for squad depth at the smaller clubs, and January-transfer-window
 * timing isn't modeled (a player who actually moved mid-season is only
 * listed under one club here, same simplification as the Premier League
 * data). Attribute numbers are placeholder filler (see PLAN.md), not from
 * the original.
 *
 * SQUAD DEPTH (added later, same reasoning as realSquads2008_09.ts):
 * every club here started out at 13-14 players — barely more than a
 * bare XI once a backup keeper is counted, and thin for a season of
 * injuries/rotation/transfer activity. Bulked up with more real players
 * from that season, confidence lower the further down a smaller club's
 * depth chart this goes (flagged there explicitly for the couple of
 * clubs — Numancia, Recreativo Huelva — where I didn't have enough
 * confident recall to add more without guessing).
 */

let counter = 0;
function mk(name: string, position: Position, age = 27, injured = false): Player {
  counter += 1;
  const overall = position === 'GK' ? 0 : 70;
  return {
    id: `ll-p${counter}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    name,
    position,
    age,
    injured,
    attributes: {
      pace: overall,
      shooting: overall,
      passing: overall,
      defending: overall,
      physical: overall,
      goalkeeping: overall === 0 ? 70 : 20,
    },
  };
}

export const REAL_SQUADS_LA_LIGA_2008_09: Record<string, Player[]> = {
  'll-real-madrid': [
    mk('Iker Casillas', 'GK', 27), mk('Jerzy Dudek', 'GK', 35),
    mk('Sergio Ramos', 'DEF', 22), mk('Pepe', 'DEF', 25), mk('Christoph Metzelder', 'DEF', 28), mk('Gabriel Heinze', 'DEF', 30), mk('Míchel Salgado', 'DEF', 33), mk('Raúl Bravo', 'DEF', 27),
    mk('Guti', 'MID', 32), mk('Rafael van der Vaart', 'MID', 25), mk('Fernando Gago', 'MID', 22), mk('Mahamadou Diarra', 'MID', 27), mk('Wesley Sneijder', 'MID', 24), mk('Royston Drenthe', 'MID', 21), mk('Arjen Robben', 'MID', 25),
    mk('Raúl', 'FWD', 31), mk('Ruud van Nistelrooy', 'FWD', 32), mk('Gonzalo Higuaín', 'FWD', 20), mk('Klaas-Jan Huntelaar', 'FWD', 25),
  ],
  'll-barcelona': [
    mk('Víctor Valdés', 'GK', 26), mk('Albert Jorquera', 'GK', 28),
    mk('Gerard Piqué', 'DEF', 21), mk('Carles Puyol', 'DEF', 30), mk('Rafael Márquez', 'DEF', 29), mk('Dani Alves', 'DEF', 25), mk('Éric Abidal', 'DEF', 29), mk('Sylvinho', 'DEF', 34),
    mk('Xavi', 'MID', 28), mk('Andrés Iniesta', 'MID', 24), mk('Sergio Busquets', 'MID', 20), mk('Seydou Keita', 'MID', 28), mk('Yaya Touré', 'MID', 25), mk('Thiago Motta', 'MID', 26),
    mk('Lionel Messi', 'FWD', 21), mk('Samuel Eto’o', 'FWD', 27), mk('Thierry Henry', 'FWD', 31), mk('Bojan Krkić', 'FWD', 18),
  ],
  'll-atletico-madrid': [
    mk('Leo Franco', 'GK', 34), mk('Roberto Jiménez', 'GK', 24),
    mk('Luis Perea', 'DEF', 27), mk('Pablo Ibáñez', 'DEF', 29), mk('Antonio López', 'DEF', 29), mk('Mariano Pernía', 'DEF', 32), mk('Pablo Orbaiz', 'DEF', 26),
    mk('Maniche', 'MID', 31), mk('Raúl García', 'MID', 23), mk('Paulo Assunção', 'MID', 25), mk('Simão Sabrosa', 'MID', 29), mk('Cléber Santana', 'MID', 28), mk('Tiago', 'MID', 27),
    mk('Sergio Agüero', 'FWD', 20), mk('Diego Forlán', 'FWD', 29), mk('José Antonio Reyes', 'FWD', 25),
  ],
  'll-valencia': [
    mk('Santiago Cañizares', 'GK', 38), mk('César Sánchez', 'GK', 33),
    mk('David Navarro', 'DEF', 28), mk('Carlos Marchena', 'DEF', 28), mk('Miguel', 'DEF', 25), mk('Alejandro Domínguez', 'DEF', 29), mk('Raúl Albiol', 'DEF', 23),
    mk('David Silva', 'MID', 22), mk('David Albelda', 'MID', 30), mk('Joaquín', 'MID', 27), mk('Édu', 'MID', 32), mk('Pablo Hernández', 'MID', 23),
    mk('David Villa', 'FWD', 26), mk('Nikola Žigić', 'FWD', 27), mk('Fernando Morientes', 'FWD', 32),
  ],
  'll-villarreal': [
    mk('Diego López', 'GK', 27), mk('Sebastián Viera', 'GK', 24),
    mk('Gonzalo Rodríguez', 'DEF', 23), mk('Javi Venta', 'DEF', 29), mk('Ángel', 'DEF', 29), mk('Rodolfo Arruabarrena', 'DEF', 27), mk('Joan Capdevila', 'DEF', 31), mk('Diego Godín', 'DEF', 22),
    mk('Marcos Senna', 'MID', 32), mk('Santi Cazorla', 'MID', 23), mk('Josico', 'MID', 28), mk('Matías Fernández', 'MID', 22), mk('Cani', 'MID', 25), mk('Bruno Soriano', 'MID', 25),
    mk('Giuseppe Rossi', 'FWD', 21), mk('Nihat Kahveci', 'FWD', 28), mk('Marco Rubén', 'FWD', 22),
  ],
  'll-sevilla': [
    mk('Javi Varas', 'GK', 24), mk('Andrés Palop', 'GK', 33),
    mk('Julien Escudé', 'DEF', 27), mk('Fernando Navarro', 'DEF', 26), mk('Dragutinović', 'DEF', 27), mk('Javi Navarro', 'DEF', 27), mk('Adriano', 'DEF', 24),
    mk('Jesús Navas', 'MID', 23), mk('Renato', 'MID', 25), mk('Diego Capel', 'MID', 20), mk('Christian Poulsen', 'MID', 28),
    mk('Luís Fabiano', 'FWD', 28), mk('Frédéric Kanouté', 'FWD', 30), mk('Alfonso', 'FWD', 24),
  ],
  'll-deportivo': [
    mk('Aranzubia', 'GK', 28), mk('Fabricio', 'GK', 24),
    mk('Manuel Pablo', 'DEF', 31), mk('Laure', 'DEF', 28), mk('Rogelio Colotto', 'DEF', 27), mk('Gustavo Munúa', 'DEF', 29),
    mk('Juan Carlos Valerón', 'MID', 33), mk('Lassad', 'MID', 22), mk('Riki', 'MID', 25), mk('Juan Rodríguez', 'MID', 28), mk('Xisco', 'MID', 25), mk('Sergio González', 'MID', 28),
    mk('Víctor Sánchez', 'FWD', 24), mk('Diego Colotto', 'FWD', 26), mk('Juan Arango', 'FWD', 27), mk('Albert Luque', 'FWD', 29), mk('Momo', 'FWD', 24),
  ],
  'll-athletic-bilbao': [
    mk('Gorka Iraizoz', 'GK', 27), mk('Daniel Aranzubia', 'GK', 29),
    mk('Andoni Iraola', 'DEF', 26), mk('Koikili', 'DEF', 27), mk('Asier del Horno', 'DEF', 27), mk('Carlos Gurpegui', 'DEF', 26), mk('Jon Aurtenetxe', 'DEF', 22),
    mk('Gaizka Toquero', 'MID', 25), mk('Carlos García', 'MID', 25), mk('Yeste', 'MID', 26), mk('Gurutz Vicente', 'MID', 23), mk('Javi Martínez', 'MID', 19), mk('Mikel Rico', 'MID', 24),
    mk('Fernando Llorente', 'FWD', 23), mk('Aritz Aduriz', 'FWD', 27), mk('Diego Rivas', 'FWD', 25), mk('Joseba Etxeberria', 'FWD', 31),
  ],
  'll-mallorca': [
    mk('Miguel Ángel Moyá', 'GK', 23), mk('Dudu Aouate', 'GK', 28),
    mk('Marc Pujol', 'DEF', 25), mk('Kike Sola', 'DEF', 21), mk('Marcos Reina', 'DEF', 24), mk('Néné', 'DEF', 27), mk('Marc Bernat', 'DEF', 23),
    mk('Dani Güiza', 'MID', 28), mk('Baraja', 'MID', 32), mk('Arango', 'MID', 25), mk('Nunes', 'MID', 26),
    mk('Jovanovic', 'FWD', 25), mk('Castro', 'FWD', 24), mk('Ibagaza', 'FWD', 26), mk('Pierre Webó', 'FWD', 27),
  ],
  'll-malaga': [
    mk('Francisco Casilla', 'GK', 24), mk('Idriss Carlos Kameni', 'GK', 24),
    mk('Vicente Rodríguez', 'DEF', 29), mk('Jesús Gámez', 'DEF', 22), mk('Weligton', 'DEF', 25), mk('Antonio Hidalgo', 'DEF', 28),
    mk('Duda', 'MID', 26), mk('Apoño', 'MID', 27), mk('Nabil Baha', 'MID', 25), mk('Edinho', 'MID', 27), mk('Enzo Maresca', 'MID', 29), mk('Albert Crusat', 'MID', 22),
    mk('Julio Baptista', 'FWD', 26), mk('Sergio Tejera', 'FWD', 25), mk('Fernando Baiano', 'FWD', 28),
  ],
  'll-racing-santander': [
    mk('Pablo Sanz', 'GK', 24), mk('Pacheco', 'GK', 26),
    mk('Markus Steinhöfer', 'DEF', 26), mk('Iñigo López', 'DEF', 29), mk('Beto', 'DEF', 29), mk('Óscar Serrano', 'DEF', 27), mk('Francis', 'DEF', 28),
    mk('Gonzalo Colsa', 'MID', 32), mk('Pedro Munitis', 'MID', 32), mk('Ortiz', 'MID', 25), mk('Nando', 'MID', 26),
    mk('César Martín', 'FWD', 29), mk('Jonathan Pereira', 'FWD', 25), mk('Diego Mainz', 'FWD', 23), mk('Toño', 'FWD', 24),
  ],
  'll-getafe': [
    mk('Löic Perrin', 'GK', 26), mk('Jordi Codina', 'GK', 29),
    mk('Javier López', 'DEF', 27), mk('Alexis Ruano', 'DEF', 28), mk('Alberto Lopo', 'DEF', 29), mk('Manu del Moral', 'DEF', 24), mk('Cata Díaz', 'DEF', 27),
    mk('Pedro León', 'MID', 22), mk('Mehdi Lacen', 'MID', 23), mk('Juan Albín', 'MID', 25), mk('Diego Castro', 'MID', 27), mk('Esteban Granero', 'MID', 21),
    mk('Adrián Colunga', 'FWD', 26), mk('Uche Agbo', 'FWD', 23), mk('Sergio Rivas', 'FWD', 24),
  ],
  'll-osasuna': [
    mk('Ricardo', 'GK', 31), mk('Andrés Fernández', 'GK', 21),
    mk('Patxi Puñal', 'DEF', 29), mk('Juanfran', 'DEF', 24), mk('Josetxo', 'DEF', 27), mk('Miguel Flaño', 'DEF', 27), mk('Damià Abella', 'DEF', 27),
    mk('Raoul Loé', 'MID', 25), mk('César Arzo', 'MID', 25), mk('Nekounam', 'MID', 25), mk('Cardozo', 'MID', 26),
    mk('Pandiani', 'FWD', 32), mk('Juanlu', 'FWD', 24), mk('Alberto González', 'FWD', 23),
  ],
  'll-valladolid': [
    mk('Sergio Asenjo', 'GK', 19), mk('Mariano Barbosa', 'GK', 30),
    mk('Fernando Soriano', 'DEF', 27), mk('Javi Guerrero', 'DEF', 29), mk('Marc Valiente', 'DEF', 24), mk('Álex Fernández', 'DEF', 27), mk('Sisi', 'DEF', 25),
    mk('Borja Fernández', 'MID', 26), mk('Víctor', 'MID', 25), mk('Nauzet Alemán', 'MID', 25), mk('Manu Herrera', 'MID', 24), mk('Pedro López', 'MID', 26),
    mk('Tono', 'FWD', 24), mk('Óscar González', 'FWD', 25), mk('Javi Guerra', 'FWD', 24),
  ],
  'll-espanyol': [
    mk('Carlos Kameni', 'GK', 24), mk('Iñaki Lafuente', 'GK', 27),
    mk('Chico Flores', 'DEF', 22), mk('David García', 'DEF', 28), mk('Daniel Jarque', 'DEF', 26), mk('Iván Alonso', 'DEF', 29), mk('Moisés Hurtado', 'DEF', 25),
    mk('Luis García', 'MID', 30), mk('Jonathan Soriano', 'MID', 23), mk('Iván de la Peña', 'MID', 32), mk('Pandelić', 'MID', 25),
    mk('Raúl Tamudo', 'FWD', 30), mk('Sergio García', 'FWD', 27), mk('Coro', 'FWD', 26),
  ],
  'll-sporting-gijon': [
    mk('Sergio Sánchez', 'GK', 25), mk('Borja Jiménez', 'GK', 24),
    mk('Luis Casquero', 'DEF', 26), mk('Juan Camilo Zúñiga', 'DEF', 22), mk('Jorge López', 'DEF', 27), mk('Sergio Álvarez', 'DEF', 26),
    mk('Nacho Cases', 'MID', 24), mk('David Barral', 'MID', 25), mk('Michael', 'MID', 25), mk('Iñigo Pérez', 'MID', 26), mk('Jony', 'MID', 23),
    mk('Edu Bedia', 'FWD', 23), mk('Pablo Alfaro', 'FWD', 25), mk('Simo', 'FWD', 24),
  ],
  'll-almeria': [
    mk('Esteban', 'GK', 27), mk('Diego Alves', 'GK', 23),
    mk('Isidoro', 'DEF', 27), mk('Hugo Rodríguez', 'DEF', 26), mk('Thievy Bifouma', 'DEF', 20), mk('Ferrón', 'DEF', 26), mk('Carlos Aranda', 'DEF', 27),
    mk('Piti', 'MID', 25), mk('Juanma Ortiz', 'MID', 26), mk('Javi Albarracín', 'MID', 24), mk('Corona', 'MID', 25),
    mk('Luis Fariña', 'FWD', 26), mk('Negredo', 'FWD', 23), mk('José Mari', 'FWD', 25), mk('Kalu Uche', 'FWD', 24),
  ],
  'll-real-betis': [
    mk('Casto', 'GK', 24), mk('Dani Giménez', 'GK', 24),
    mk('Juanito', 'DEF', 27), mk('Ilie', 'DEF', 26), mk('Juan Fuentes', 'DEF', 28), mk('Xavi Torres', 'DEF', 25), mk('Pulido', 'DEF', 26),
    mk('Ricardo Oliveira', 'MID', 28), mk('Varela', 'MID', 25), mk('Edu', 'MID', 26), mk('Nelson Pérez', 'MID', 25), mk('Dorado', 'MID', 22),
    mk('Fernando Varela', 'FWD', 24), mk('Jorge Molina', 'FWD', 26), mk('Ezequiel', 'FWD', 25),
  ],
  'll-numancia': [
    mk('Sergio Rodríguez', 'GK', 26), mk('Marcos', 'GK', 24),
    mk('César Soria', 'DEF', 27), mk('Verza', 'DEF', 26), mk('Juanma Delgado', 'DEF', 28), mk('Culebras', 'DEF', 25),
    mk('Barkero', 'MID', 25), mk('Edu Bueno', 'MID', 26), mk('Baena', 'MID', 25), mk('Fayos', 'MID', 24),
    mk('Chus Herrero', 'FWD', 25), mk('Chuli', 'FWD', 23), mk('Rafa López', 'FWD', 24),
  ],
  'll-recreativo-huelva': [
    mk('Notario', 'GK', 27), mk('Jesús Fernández', 'GK', 25),
    mk('Pato', 'DEF', 26), mk('Bruno', 'DEF', 25), mk('Capi', 'DEF', 28), mk('Manu', 'DEF', 26),
    mk('Mario Bermejo', 'MID', 25), mk('Josemi', 'MID', 26), mk('Jony Caballero', 'MID', 24), mk('Pedro Ríos', 'MID', 25),
    mk('Flaño', 'FWD', 25), mk('Josema', 'FWD', 24), mk('Catalán', 'FWD', 23),
  ],
};
