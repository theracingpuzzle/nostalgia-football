import type { Player, Position } from '../engine/types';

/**
 * Squads for all 24 clubs of the 2008/09 Championship season, keyed by the
 * club ids in championship0809.ts. Same caveat and conventions as
 * realSquads2008_09.ts / realSquadsLaLiga0809.ts: a best-effort
 * reconstruction from memory, not a verified source. Confidence is higher
 * for the clubs that went up or down that season (promoted: Wolves,
 * Birmingham, Burnley; relegated: Norwich, Southampton, Charlton) and for
 * well-known individual players, lower for squad depth at the smaller
 * clubs. January-transfer-window timing isn't modeled (a player who
 * actually moved mid-season, or just before/after this season, is only
 * listed under one club here, same simplification as the other leagues).
 * Attribute numbers are placeholder filler (see PLAN.md), not from the
 * original.
 *
 * SQUAD DEPTH (added later, same reasoning as realSquads2008_09.ts /
 * realSquadsLaLiga0809.ts): two thirds of these clubs started out at
 * exactly 13 players — barely a bare XI plus a backup keeper, thin for a
 * season of injuries/rotation/transfer activity. Bulked up with more
 * real players from that season; confidence is lower for this added
 * depth than for the first-teamers already flagged above.
 */

let counter = 0;
function mk(name: string, position: Position, age = 27, injured = false): Player {
  counter += 1;
  const overall = position === 'GK' ? 0 : 70;
  return {
    id: `ch-p${counter}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
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

export const REAL_SQUADS_CHAMPIONSHIP_2008_09: Record<string, Player[]> = {
  'ch-wolves': [
    mk('Wayne Hennessey', 'GK', 21), mk('Matt Murray', 'GK', 27),
    mk('Jody Craddock', 'DEF', 32), mk('Richard Stearman', 'DEF', 21), mk('George Elokobi', 'DEF', 22), mk('Kevin Foley', 'DEF', 25), mk('Michael Mancienne', 'DEF', 20), mk('Stephen Ward', 'DEF', 25),
    mk('Karl Henry', 'MID', 25), mk('Michael Kightly', 'MID', 22), mk('David Jones', 'MID', 24), mk('David Edwards', 'MID', 21), mk('Matt Jarvis', 'MID', 22),
    mk('Sylvan Ebanks-Blake', 'FWD', 22), mk('Andy Keogh', 'FWD', 22), mk('Stephen Elliott', 'FWD', 25),
  ],
  'ch-birmingham': [
    mk('Maik Taylor', 'GK', 36), mk('Colin Doyle', 'GK', 23),
    mk('Stephen Carr', 'DEF', 32), mk('Roger Johnson', 'DEF', 25), mk('Liam Ridgewell', 'DEF', 23), mk('Franck Queudrue', 'DEF', 29), mk('Stuart Parnaby', 'DEF', 26),
    mk('Lee Bowyer', 'MID', 31), mk('Barry Ferguson', 'MID', 30), mk('Sebastian Larsson', 'MID', 23), mk('James McFadden', 'MID', 25), mk('Gary McSheffrey', 'MID', 25), mk('Mehdi Nafti', 'MID', 32),
    mk('Cameron Jerome', 'FWD', 22), mk('Kevin Phillips', 'FWD', 35), mk('Garry O’Connor', 'FWD', 25),
  ],
  'ch-sheffield-utd': [
    mk('Paddy Kenny', 'GK', 30), mk('Justin Haber', 'GK', 24),
    mk('Chris Morgan', 'DEF', 31), mk('Matt Kilgallon', 'DEF', 24), mk('Claude Davis', 'DEF', 27), mk('Neill Collins', 'DEF', 26), mk('Kyle Naughton', 'DEF', 19),
    mk('Lee Williamson', 'MID', 25), mk('Jamie Ward', 'MID', 22), mk('David Cotterill', 'MID', 21), mk('Stephen Quinn', 'MID', 22), mk('Nick Montgomery', 'MID', 26),
    mk('James Beattie', 'FWD', 30), mk('Richard Cresswell', 'FWD', 30), mk('Billy Sharp', 'FWD', 22),
  ],
  'ch-burnley': [
    mk('Brian Jensen', 'GK', 35), mk('Danny Coyne', 'GK', 35),
    mk('Steven Caldwell', 'DEF', 27), mk('Clarke Carlisle', 'DEF', 29), mk('Graham Alexander', 'DEF', 36), mk('Michael Duff', 'DEF', 30),
    mk('Wade Elliott', 'MID', 28), mk('Chris McCann', 'MID', 22), mk('Robbie Blake', 'MID', 29), mk('Joey Gudjonsson', 'MID', 28), mk('Kevin McDonald', 'MID', 20), mk('Alan Mahon', 'MID', 29),
    mk('Steven Fletcher', 'FWD', 21), mk('Martin Paterson', 'FWD', 20), mk('Ade Akinbiyi', 'FWD', 34), mk('Besian Idrizaj', 'FWD', 19),
  ],
  'ch-preston': [
    mk('Andy Lonergan', 'GK', 24), mk('Chris Neal', 'GK', 22),
    mk('Youl Mawéné', 'DEF', 29), mk('Liam Chilvers', 'DEF', 28), mk('Billy Jones', 'DEF', 22), mk('Sean St Ledger', 'DEF', 23), mk('Callum Davidson', 'DEF', 33),
    mk('Keith Treacy', 'MID', 20), mk('Paul McKenna', 'MID', 28), mk('Simon Whalley', 'MID', 21),
    mk('Jon Parkin', 'FWD', 26), mk('Chris Brown', 'FWD', 24), mk('David Nugent', 'FWD', 23), mk('Jon Macken', 'FWD', 28),
  ],
  'ch-cardiff': [
    mk('Peter Enckelman', 'GK', 31),
    mk('Darcy Blake', 'DEF', 19), mk('Kevin McNaughton', 'DEF', 26), mk('Glenn Loovens', 'DEF', 26), mk('Gavin Rae', 'DEF', 29), mk('Tony Capaldi', 'DEF', 27),
    mk('Joe Ledley', 'MID', 22), mk('Stephen McPhail', 'MID', 28), mk('Paul Parry', 'MID', 28), mk('Mark Kennedy', 'MID', 32), mk('Chris Burke', 'MID', 25), mk('Trevor Sinclair', 'MID', 35),
    mk('Jay Bothroyd', 'FWD', 26), mk('Michael Chopra', 'FWD', 25), mk('Ross McCormack', 'FWD', 22),
  ],
  'ch-swansea': [
    mk('Dorus de Vries', 'GK', 27),
    mk('Garry Monk', 'DEF', 29), mk('Alan Tate', 'DEF', 27), mk('Angel Rangel', 'DEF', 25), mk('Kristian O’Leary', 'DEF', 31),
    mk('Leon Britton', 'MID', 26), mk('Darren Pratley', 'MID', 23), mk('Andy Robinson', 'MID', 28), mk('Ferrie Bodde', 'MID', 27), mk('Nathan Dyer', 'MID', 21), mk('Joe Allen', 'MID', 18),
    mk('Jason Scotland', 'FWD', 29), mk('Shefki Kuqi', 'FWD', 30), mk('Guillem Bauzà', 'FWD', 26),
  ],
  'ch-reading': [
    mk('Adam Federici', 'GK', 23),
    mk('Ivar Ingimarsson', 'DEF', 30), mk('Liam Rosenior', 'DEF', 25), mk('Graeme Murty', 'DEF', 34), mk('Michael Duberry', 'DEF', 32), mk('Andre Bikey', 'DEF', 26),
    mk('Brynjar Gunnarsson', 'MID', 32), mk('James Harper', 'MID', 27), mk('Marek Matejovský', 'MID', 25), mk('Glen Little', 'MID', 32), mk('Jimmy Kébé', 'MID', 23),
    mk('Kevin Doyle', 'FWD', 25), mk('Noel Hunt', 'FWD', 24), mk('Shane Long', 'FWD', 21), mk('Simon Church', 'FWD', 20),
  ],
  'ch-forest': [
    mk('Paul Smith', 'GK', 27),
    mk('Wes Morgan', 'DEF', 24), mk('Kelvin Wilson', 'DEF', 23), mk('Luke Chambers', 'DEF', 21), mk('Julian Bennett', 'DEF', 21), mk('Chris Gunter', 'DEF', 19), mk('Danny Fox', 'DEF', 22),
    mk('Chris Cohen', 'MID', 22), mk('Lewis McGugan', 'MID', 20), mk('Paul Anderson', 'MID', 20), mk('Garath McCleary', 'MID', 21),
    mk('Nathan Tyson', 'FWD', 26), mk('Rob Earnshaw', 'FWD', 28), mk('Dexter Blackstock', 'FWD', 22),
  ],
  'ch-doncaster': [
    mk('Neil Sullivan', 'GK', 39),
    mk('Gareth Grant', 'DEF', 22), mk('Graeme Lee', 'DEF', 29), mk('Sam Hird', 'DEF', 26), mk('Gareth Roberts', 'DEF', 29),
    mk('James Coppinger', 'MID', 27), mk('Brian Stock', 'MID', 27), mk('Richie Wellens', 'MID', 29), mk('Martin Woods', 'MID', 24), mk('Sam Togwell', 'MID', 24), mk('John Spicer', 'MID', 27),
    mk('Mark McCammon', 'FWD', 28), mk('Jason Price', 'FWD', 28), mk('Paul Heffernan', 'FWD', 25),
  ],
  'ch-ipswich': [
    mk('Richard Wright', 'GK', 31),
    mk('David Wright', 'DEF', 24), mk('Gareth McAuley', 'DEF', 28), mk('Alex Bruce', 'DEF', 24), mk('Richard Naylor', 'DEF', 32),
    mk('Gavin Williams', 'MID', 27), mk('Alan Quinn', 'MID', 28), mk('Owen Garvan', 'MID', 20), mk('Jaime Peters', 'MID', 24), mk('Tommy Miller', 'MID', 27), mk('Liam Trotter', 'MID', 19),
    mk('Jon Walters', 'FWD', 25), mk('Alan Lee', 'FWD', 28), mk('Pablo Counago', 'FWD', 28), mk('Danny Haynes', 'FWD', 21),
  ],
  'ch-bristol-city': [
    mk('Adriano Basso', 'GK', 28),
    mk('Louis Carey', 'DEF', 33), mk('Liam Fontaine', 'DEF', 22), mk('Jamie McCombe', 'DEF', 24), mk('Jamie McAllister', 'DEF', 29),
    mk('Lee Johnson', 'MID', 27), mk('Michael McIndoe', 'MID', 27), mk('David Noble', 'MID', 25), mk('Marvin Elliott', 'MID', 23), mk('Cole Skuse', 'MID', 21), mk('Scott Murray', 'MID', 32),
    mk('Nicky Maynard', 'FWD', 21), mk('Lee Trundle', 'FWD', 32), mk('Dele Adebola', 'FWD', 33), mk('Steve Brooker', 'FWD', 27),
  ],
  'ch-blackpool': [
    mk('Paul Rachubka', 'GK', 26), mk('Matt Gilks', 'GK', 26), mk('Richard Kingson', 'GK', 30),
    mk('Stephen Crainey', 'DEF', 26), mk('Alex Baptiste', 'DEF', 24), mk('Ian Evatt', 'DEF', 27),
    mk('Wes Hoolahan', 'MID', 26), mk('Keith Southern', 'MID', 28), mk('Charlie Adam', 'MID', 23), mk('Elliot Grandin', 'MID', 21),
    mk('Keigan Parker', 'FWD', 27), mk('DJ Campbell', 'FWD', 26), mk('Gary Taylor-Fletcher', 'FWD', 27), mk('Billy Clarke', 'FWD', 19),
  ],
  'ch-crystal-palace': [
    mk('Julián Speroni', 'GK', 29),
    mk('Patrick McCarthy', 'DEF', 26), mk('Mo Camara', 'DEF', 29), mk('Danny Butterfield', 'DEF', 28), mk('Matt Lawrence', 'DEF', 30), mk('Johnny Ertl', 'DEF', 23), mk('Jermaine Darlington', 'DEF', 29),
    mk('Shaun Derry', 'MID', 29), mk('Victor Moses', 'MID', 18), mk('Neil Danns', 'MID', 25), mk('Darren Ambrose', 'MID', 25),
    mk('Clinton Morrison', 'FWD', 30), mk('Freddie Sears', 'FWD', 19), mk('Scott Sinclair', 'FWD', 19), mk('Dougie Freedman', 'FWD', 35),
  ],
  'ch-watford': [
    mk('Richard Lee', 'GK', 26), mk('Scott Loach', 'GK', 20),
    mk('Lloyd Doyley', 'DEF', 24), mk('Jay DeMerit', 'DEF', 29), mk('Jordan Stewart', 'DEF', 25), mk('Martin Taylor', 'DEF', 29), mk('Adrian Mariappa', 'DEF', 21),
    mk('Jobi McAnuff', 'MID', 26), mk('Tommy Smith', 'MID', 25), mk('Don Cowie', 'MID', 25), mk('John Eustace', 'MID', 28),
    mk('Nathan Ellington', 'FWD', 27), mk('Marlon King', 'FWD', 28), mk('Danny Graham', 'FWD', 21), mk('Jay Simpson', 'FWD', 20),
  ],
  'ch-sheffield-wed': [
    mk('Lee Grant', 'GK', 25), mk('Nico Vaesen', 'GK', 35),
    mk('Lee Bullen', 'DEF', 37), mk('Miguel Llera', 'DEF', 27), mk('Darren Purse', 'DEF', 31),
    mk('Kalifa Cissé', 'MID', 26), mk('Jose Semedo', 'MID', 24), mk('Burton O’Brien', 'MID', 26), mk('Jermaine Johnson', 'MID', 27), mk('Giles Coke', 'MID', 25),
    mk('Marcus Tudgay', 'FWD', 24), mk('Francis Jeffers', 'FWD', 27), mk('Wade Small', 'FWD', 26), mk('Akpo Sodje', 'FWD', 28),
  ],
  'ch-coventry': [
    mk('Keiren Westwood', 'GK', 23),
    mk('Elliott Ward', 'DEF', 24), mk('Stephen Wright', 'DEF', 29), mk('Richard Keogh', 'DEF', 22), mk('Marcus Hall', 'DEF', 33), mk('Daniel Fenlon', 'DEF', 25), mk('Arjan De Zeeuw', 'DEF', 35),
    mk('Michael Doyle', 'MID', 25), mk('Jay Tabb', 'MID', 25), mk('Sammy Clingan', 'MID', 23), mk('David Bell', 'MID', 25),
    mk('Leon Best', 'FWD', 21), mk('Michael Mifsud', 'FWD', 26), mk('Robbie Simpson', 'FWD', 23), mk('Clive Platt', 'FWD', 27),
  ],
  'ch-barnsley': [
    mk('Luke Steele', 'GK', 23),
    mk('Bobby Hassell', 'DEF', 28), mk('Rob Kozluk', 'DEF', 31), mk('Stephen Foster', 'DEF', 27), mk('Dominik Werling', 'DEF', 24), mk('Gudmundur Sævarsson', 'DEF', 26),
    mk('Martin Devaney', 'MID', 27), mk('Jamal Campbell-Ryce', 'MID', 25), mk('Brian Howard', 'MID', 26), mk('Adam Hammill', 'MID', 20), mk('Danny Schofield', 'MID', 27),
    mk('Iain Hume', 'FWD', 25), mk('Craig Davies', 'FWD', 21), mk('Kayode Odejayi', 'FWD', 24),
  ],
  'ch-derby': [
    mk('Stephen Bywater', 'GK', 25), mk('Roy Carroll', 'GK', 31),
    mk('Jason Shackell', 'DEF', 23), mk('Miles Addison', 'DEF', 19), mk('Lewin Nyatanga', 'DEF', 21), mk('Tyrone Mears', 'DEF', 25), mk('Martin Albrechtsen', 'DEF', 28), mk('Shaun Barker', 'DEF', 25),
    mk('Robbie Savage', 'MID', 34), mk('Kris Commons', 'MID', 25), mk('Giles Barnes', 'MID', 20), mk('John Oster', 'MID', 29),
    mk('Rob Hulse', 'FWD', 29), mk('Steve Davies', 'FWD', 20),
  ],
  'ch-plymouth': [
    mk('Romain Larrieu', 'GK', 33),
    mk('Krisztián Tímár', 'DEF', 27), mk('Reda Johnson', 'DEF', 20), mk('Marcel Seip', 'DEF', 26),
    mk('Paul Wotton', 'MID', 27), mk('David Norris', 'MID', 25), mk('Jason Puncheon', 'MID', 22), mk('Peter Halmosi', 'MID', 27), mk('Luke Summerfield', 'MID', 20), mk('Bojan Djordjic', 'MID', 25), mk('Carl Fletcher', 'MID', 27),
    mk('Steve MacLean', 'FWD', 25), mk('Jamie Mackie', 'FWD', 22), mk('Rory Fallon', 'FWD', 27),
  ],
  'ch-qpr': [
    mk('Lee Camp', 'GK', 24),
    mk('Damion Stewart', 'DEF', 28), mk('Clint Hill', 'DEF', 29), mk('Fitz Hall', 'DEF', 29), mk('Kaspars Gorkss', 'DEF', 27),
    mk('Martin Rowlands', 'MID', 29), mk('Mikele Leigertwood', 'MID', 26), mk('Alejandro Faurlín', 'MID', 22), mk('Lee Cook', 'MID', 26), mk('Gavin Mahon', 'MID', 30),
    mk('Akos Buzsaky', 'FWD', 24), mk('Rowan Vine', 'FWD', 24), mk('Heiður Helguson', 'FWD', 31), mk('Patrick Agyemang', 'FWD', 29),
  ],
  'ch-norwich': [
    mk('David Marshall', 'GK', 23),
    mk('Adam Drury', 'DEF', 29), mk('Michael Nelson', 'DEF', 26), mk('Gary Doherty', 'DEF', 30), mk('Jon Otsemobor', 'DEF', 26), mk('Jens Berthel Askou', 'DEF', 24),
    mk('Darel Russell', 'MID', 25), mk('Lee Croft', 'MID', 22), mk('David Fox', 'MID', 24), mk('Simon Lappin', 'MID', 26),
    mk('Simeon Jackson', 'FWD', 21), mk('Chris Martin', 'FWD', 20), mk('Ryan Jarvis', 'FWD', 20), mk('Ched Evans', 'FWD', 19),
  ],
  'ch-southampton': [
    mk('Kelvin Davis', 'GK', 31),
    mk('Dan Harding', 'DEF', 23), mk('Jose Fonte', 'DEF', 24), mk('Radhi Jaidi', 'DEF', 33), mk('Gary Monk', 'DEF', 29),
    mk('Andrew Surman', 'MID', 21), mk('Jermaine Wilson', 'MID', 24), mk('Youssef Safri', 'MID', 31), mk('Jhon Viáfara', 'MID', 27),
    mk('David McGoldrick', 'FWD', 20), mk('Stern John', 'FWD', 32), mk('Jason Euell', 'FWD', 31), mk('Bradley Wright-Phillips', 'FWD', 19), mk('Papa Waigo', 'FWD', 20),
  ],
  'ch-charlton': [
    mk('Nicky Weaver', 'GK', 30), mk('Rob Elliot', 'GK', 22),
    mk('Yassin Moutaouakil', 'DEF', 23), mk('Sam Sodje', 'DEF', 29), mk('Gonzalo Jara', 'DEF', 21), mk('Kelly Youga', 'DEF', 24), mk('Grant Basey', 'DEF', 19),
    mk('Zheng Zhi', 'MID', 28), mk('Therry Racon', 'MID', 22), mk('Lloyd Sam', 'MID', 25),
    mk('Deon Burton', 'FWD', 31), mk('Chris Iwelumo', 'FWD', 29), mk('Chris Dickson', 'FWD', 20), mk('Izale McLeod', 'FWD', 24),
  ],
};
