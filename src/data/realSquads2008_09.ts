import type { Player, Position } from '../engine/types';

/**
 * Real squads for all 20 clubs of the 2008/09 Premier League season, keyed
 * by the club ids in premierLeague0809.ts.
 *
 * CAVEAT (same as the original Everton-only version of this data): this is a
 * best-effort reconstruction from memory, not a verified source. Confidence
 * is high for each club's headline/regular first-teamers and very high for
 * the fact that each of these 20 clubs played in the league that season;
 * it's lower for exact squad depth, shirt numbers (omitted entirely, same
 * reasoning as before), and precise January-transfer-window timing (a
 * handful of players moved clubs mid-season — e.g. Robbie Keane, Jermain
 * Defoe, Shay Given — and are only listed under one club here rather than
 * modeling mid-season transfers). Treat this whole file as provisional;
 * flag anything you know to be wrong and it'll get corrected rather than
 * guessed around. Attribute numbers are placeholder filler, not from the
 * original (see PLAN.md — the original's actual attribute system is
 * unknown) — these screens don't display them yet.
 */

let counter = 0;
function mk(name: string, position: Position, age = 27, injured = false): Player {
  counter += 1;
  const overall = position === 'GK' ? 0 : 70;
  return {
    id: `p${counter}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
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

export const REAL_SQUADS_2008_09: Record<string, Player[]> = {
  'man-utd': [
    mk('Edwin van der Sar', 'GK', 38), mk('Ben Foster', 'GK', 25),
    mk('Rio Ferdinand', 'DEF', 29), mk('Nemanja Vidic', 'DEF', 27), mk('Patrice Evra', 'DEF', 27),
    mk('Gary Neville', 'DEF', 33), mk('Wes Brown', 'DEF', 29), mk('John O’Shea', 'DEF', 27),
    mk('Ryan Giggs', 'MID', 35), mk('Paul Scholes', 'MID', 34), mk('Michael Carrick', 'MID', 27),
    mk('Anderson', 'MID', 20), mk('Park Ji-sung', 'MID', 27), mk('Darren Fletcher', 'MID', 24), mk('Nani', 'MID', 22),
    mk('Cristiano Ronaldo', 'FWD', 23), mk('Wayne Rooney', 'FWD', 23), mk('Carlos Tevez', 'FWD', 24), mk('Dimitar Berbatov', 'FWD', 27),
  ],
  liverpool: [
    mk('Pepe Reina', 'GK', 26), mk('Diego Cavalieri', 'GK', 26),
    mk('Jamie Carragher', 'DEF', 30), mk('Daniel Agger', 'DEF', 23), mk('Alvaro Arbeloa', 'DEF', 25),
    mk('Fabio Aurelio', 'DEF', 28), mk('Sami Hyypia', 'DEF', 34),
    mk('Steven Gerrard', 'MID', 28), mk('Xabi Alonso', 'MID', 26), mk('Javier Mascherano', 'MID', 24),
    mk('Dirk Kuyt', 'MID', 28), mk('Albert Riera', 'MID', 26), mk('Lucas Leiva', 'MID', 21),
    mk('Fernando Torres', 'FWD', 24), mk('Ryan Babel', 'FWD', 21), mk('David Ngog', 'FWD', 19), mk('Andriy Voronin', 'FWD', 29),
  ],
  chelsea: [
    mk('Petr Cech', 'GK', 26), mk('Henrique Hilario', 'GK', 31),
    mk('John Terry', 'DEF', 27), mk('Ricardo Carvalho', 'DEF', 30), mk('Ashley Cole', 'DEF', 27),
    mk('Alex', 'DEF', 25), mk('Jose Bosingwa', 'DEF', 25),
    mk('Frank Lampard', 'MID', 30), mk('Michael Essien', 'MID', 25), mk('Michael Ballack', 'MID', 32),
    mk('Joe Cole', 'MID', 26), mk('Florent Malouda', 'MID', 28), mk('Deco', 'MID', 30),
    mk('Didier Drogba', 'FWD', 30), mk('Nicolas Anelka', 'FWD', 29), mk('Salomon Kalou', 'FWD', 23),
  ],
  arsenal: [
    mk('Manuel Almunia', 'GK', 31), mk('Lukasz Fabianski', 'GK', 23),
    mk('William Gallas', 'DEF', 31), mk('Kolo Toure', 'DEF', 27), mk('Bacary Sagna', 'DEF', 25),
    mk('Gael Clichy', 'DEF', 23), mk('Mikael Silvestre', 'DEF', 31),
    mk('Cesc Fabregas', 'MID', 21), mk('Alexandre Song', 'MID', 21), mk('Denilson', 'MID', 20),
    mk('Samir Nasri', 'MID', 21), mk('Theo Walcott', 'MID', 19), mk('Tomas Rosicky', 'MID', 28),
    mk('Emmanuel Adebayor', 'FWD', 24), mk('Robin van Persie', 'FWD', 25), mk('Nicklas Bendtner', 'FWD', 20),
  ],
  everton: [
    mk('Tim Howard', 'GK', 29), mk('Iain Turner', 'GK', 25),
    mk('Tony Hibbert', 'DEF', 27), mk('Leighton Baines', 'DEF', 23), mk('Joleon Lescott', 'DEF', 26),
    mk('Phil Jagielka', 'DEF', 26), mk('Joseph Yobo', 'DEF', 28), mk('John Heitinga', 'DEF', 24),
    mk('Mikel Arteta', 'MID', 26), mk('Leon Osman', 'MID', 27), mk('Marouane Fellaini', 'MID', 20),
    mk('Steven Pienaar', 'MID', 26), mk('Phil Neville', 'MID', 31), mk('Tim Cahill', 'MID', 28),
    mk('Yakubu Aiyegbeni', 'FWD', 25), mk('Louis Saha', 'FWD', 29), mk('Victor Anichebe', 'FWD', 20),
  ],
  'aston-villa': [
    mk('Brad Friedel', 'GK', 37), mk('Stuart Taylor', 'GK', 27),
    mk('Luke Young', 'DEF', 29), mk('Curtis Davies', 'DEF', 23), mk('Martin Laursen', 'DEF', 30),
    mk('Wilfred Bouma', 'DEF', 27), mk('Zat Knight', 'DEF', 27),
    mk('Gareth Barry', 'MID', 27), mk('Stiliyan Petrov', 'MID', 29), mk('Ashley Young', 'MID', 23),
    mk('Steve Sidwell', 'MID', 25), mk('James Milner', 'MID', 22),
    mk('Gabriel Agbonlahor', 'FWD', 22), mk('John Carew', 'FWD', 29), mk('Marlon Harewood', 'FWD', 29),
  ],
  fulham: [
    mk('Mark Schwarzer', 'GK', 36), mk('David Stockdale', 'GK', 22),
    mk('Paul Konchesky', 'DEF', 27), mk('Aaron Hughes', 'DEF', 28), mk('Brede Hangeland', 'DEF', 27), mk('Chris Baird', 'DEF', 26),
    mk('Danny Murphy', 'MID', 31), mk('Dickson Etuhu', 'MID', 26), mk('Simon Davies', 'MID', 28),
    mk('Jimmy Bullard', 'MID', 29), mk('Zoltan Gera', 'MID', 29),
    mk('Bobby Zamora', 'FWD', 27), mk('Diomansy Kamara', 'FWD', 27), mk('Andy Johnson', 'FWD', 27),
  ],
  tottenham: [
    mk('Heurelho Gomes', 'GK', 27), mk('Carlo Cudicini', 'GK', 34),
    mk('Ledley King', 'DEF', 27), mk('Jonathan Woodgate', 'DEF', 28), mk('Benoit Assou-Ekotto', 'DEF', 24),
    mk('Alan Hutton', 'DEF', 23), mk('Younes Kaboul', 'DEF', 22),
    mk('Luka Modric', 'MID', 22), mk('Tom Huddlestone', 'MID', 21), mk('Didier Zokora', 'MID', 27),
    mk('Aaron Lennon', 'MID', 21), mk('David Bentley', 'MID', 23), mk('Jermaine Jenas', 'MID', 25),
    mk('Robbie Keane', 'FWD', 28), mk('Darren Bent', 'FWD', 24), mk('Roman Pavlyuchenko', 'FWD', 26),
  ],
  'west-ham': [
    mk('Robert Green', 'GK', 28), mk('Marek Stech', 'GK', 19),
    mk('Lucas Neill', 'DEF', 30), mk('Matthew Upson', 'DEF', 29), mk('James Collins', 'DEF', 24), mk('Herita Ilunga', 'DEF', 25),
    mk('Mark Noble', 'MID', 21), mk('Scott Parker', 'MID', 27), mk('Valon Behrami', 'MID', 23),
    mk('Jack Collison', 'MID', 19), mk('Freddie Ljungberg', 'MID', 31), mk('Luis Boa Morte', 'MID', 30),
    mk('Carlton Cole', 'FWD', 24), mk('Dean Ashton', 'FWD', 24),
  ],
  'man-city': [
    mk('Joe Hart', 'GK', 21), mk('Kasper Schmeichel', 'GK', 21),
    mk('Micah Richards', 'DEF', 19), mk('Richard Dunne', 'DEF', 28), mk('Vincent Kompany', 'DEF', 22),
    mk('Pablo Zabaleta', 'DEF', 23), mk('Wayne Bridge', 'DEF', 27),
    mk('Stephen Ireland', 'MID', 21), mk('Elano', 'MID', 27), mk('Shaun Wright-Phillips', 'MID', 26),
    mk('Martin Petrov', 'MID', 28), mk('Gelson Fernandes', 'MID', 21),
    mk('Robinho', 'FWD', 24), mk('Benjani', 'FWD', 30), mk('Jo', 'FWD', 21), mk('Darius Vassell', 'FWD', 27),
  ],
  wigan: [
    mk('Chris Kirkland', 'GK', 27), mk('Mike Pollitt', 'GK', 35),
    mk('Emerson Boyce', 'DEF', 27), mk('Paul Scharner', 'DEF', 28), mk('Titus Bramble', 'DEF', 26), mk('Mario Melchiot', 'DEF', 30),
    mk('Antonio Valencia', 'MID', 22), mk('Charles N’Zogbia', 'MID', 21), mk('Wilson Palacios', 'MID', 23),
    mk('Michael Brown', 'MID', 31), mk('Lee Cattermole', 'MID', 20),
    mk('Amr Zaki', 'FWD', 25), mk('Emile Heskey', 'FWD', 30), mk('Hugo Rodallega', 'FWD', 23),
  ],
  stoke: [
    mk('Thomas Sorensen', 'GK', 32), mk('Steve Simonsen', 'GK', 29),
    mk('Andy Griffin', 'DEF', 29), mk('Ryan Shawcross', 'DEF', 20), mk('Danny Higginbotham', 'DEF', 29), mk('Leon Cort', 'DEF', 28),
    mk('Rory Delap', 'MID', 32), mk('Glenn Whelan', 'MID', 24), mk('Liam Lawrence', 'MID', 26),
    mk('Salif Diao', 'MID', 30), mk('Matty Etherington', 'MID', 27),
    mk('Ricardo Fuller', 'FWD', 27), mk('Mama Sidibe', 'FWD', 26), mk('James Beattie', 'FWD', 30),
  ],
  bolton: [
    mk('Jussi Jaaskelainen', 'GK', 33), mk('Ali Al-Habsi', 'GK', 26),
    mk('Gretar Steinsson', 'DEF', 25), mk('Abdoulaye Meite', 'DEF', 26), mk('Andy O’Brien', 'DEF', 29), mk('Jlloyd Samuel', 'DEF', 26), mk('Danny Shittu', 'DEF', 28),
    mk('Matt Taylor', 'MID', 26), mk('Fabrice Muamba', 'MID', 20), mk('Mark Davies', 'MID', 20), mk('Kevin Nolan', 'MID', 26), mk('Gavin McCann', 'MID', 28),
    mk('Kevin Davies', 'FWD', 31), mk('Johan Elmander', 'FWD', 27),
  ],
  portsmouth: [
    mk('David James', 'GK', 38), mk('Jamie Ashdown', 'GK', 27),
    mk('Glen Johnson', 'DEF', 24), mk('Sylvain Distin', 'DEF', 30), mk('Hermann Hreidarsson', 'DEF', 33),
    mk('Sol Campbell', 'DEF', 33), mk('Nadir Belhadj', 'DEF', 25),
    mk('Lassana Diarra', 'MID', 23), mk('Sulley Muntari', 'MID', 24), mk('Papa Bouba Diop', 'MID', 28), mk('Hayden Mullins', 'MID', 30),
    mk('Jermain Defoe', 'FWD', 26), mk('Peter Crouch', 'FWD', 27), mk('Kanu', 'FWD', 32),
  ],
  blackburn: [
    mk('Jason Brown', 'GK', 30),
    mk('Chris Samba', 'DEF', 24), mk('Ryan Nelsen', 'DEF', 31), mk('Stephen Warnock', 'DEF', 26), mk('Andre Ooijer', 'DEF', 32), mk('Martin Olsson', 'DEF', 20),
    mk('David Dunn', 'MID', 29), mk('Morten Gamst Pedersen', 'MID', 26), mk('Brett Emerton', 'MID', 29), mk('Keith Andrews', 'MID', 27),
    mk('Roque Santa Cruz', 'FWD', 27), mk('Jason Roberts', 'FWD', 30), mk('Benni McCarthy', 'FWD', 31),
  ],
  sunderland: [
    mk('Craig Gordon', 'GK', 25), mk('Marton Fulop', 'GK', 26),
    mk('Anton Ferdinand', 'DEF', 23), mk('Nyron Nosworthy', 'DEF', 27), mk('Danny Collins', 'DEF', 26), mk('Paul McShane', 'DEF', 23),
    mk('Steed Malbranque', 'MID', 28), mk('Dean Whitehead', 'MID', 26), mk('Kieran Richardson', 'MID', 23), mk('Andy Reid', 'MID', 26),
    mk('Kenwyne Jones', 'FWD', 23), mk('Djibril Cisse', 'FWD', 27),
  ],
  hull: [
    mk('Boaz Myhill', 'GK', 26),
    mk('Andy Dawson', 'DEF', 30), mk('Michael Turner', 'DEF', 24), mk('Wayne Brown', 'DEF', 28), mk('Sam Ricketts', 'DEF', 27),
    mk('Ian Ashbee', 'MID', 31), mk('Geovanni', 'MID', 28), mk('George Boateng', 'MID', 33), mk('Richard Garcia', 'MID', 28),
    mk('Daniel Cousin', 'FWD', 30), mk('Craig Fagan', 'FWD', 27), mk('Caleb Folan', 'FWD', 24),
  ],
  newcastle: [
    mk('Shay Given', 'GK', 32), mk('Steve Harper', 'GK', 33),
    mk('Habib Beye', 'DEF', 28), mk('Steven Taylor', 'DEF', 22), mk('Sebastien Bassong', 'DEF', 21), mk('Jose Enrique', 'DEF', 22),
    mk('Joey Barton', 'MID', 26), mk('Nicky Butt', 'MID', 33), mk('Danny Guthrie', 'MID', 21), mk('Damien Duff', 'MID', 29), mk('Jonas Gutierrez', 'MID', 25),
    mk('Michael Owen', 'FWD', 28), mk('Obafemi Martins', 'FWD', 24), mk('Shola Ameobi', 'FWD', 26),
  ],
  middlesbrough: [
    mk('Ross Turnbull', 'GK', 23),
    mk('David Wheater', 'DEF', 21), mk('Chris Riggott', 'DEF', 26), mk('Robert Huth', 'DEF', 24), mk('Justin Hoyte', 'DEF', 24),
    mk('Gary O’Neil', 'MID', 25), mk('Julio Arca', 'MID', 27), mk('Didier Digard', 'MID', 21), mk('Adam Johnson', 'MID', 21), mk('Stewart Downing', 'MID', 24),
    mk('Mido', 'FWD', 25), mk('Tuncay Sanli', 'FWD', 25), mk('Afonso Alves', 'FWD', 25),
  ],
  'west-brom': [
    mk('Scott Carson', 'GK', 23),
    mk('Paul Robinson', 'DEF', 29), mk('Jonas Olsson', 'DEF', 25), mk('Gianni Zuiverloon', 'DEF', 21), mk('Carl Hoefkens', 'DEF', 29),
    mk('Jonathan Greening', 'MID', 29), mk('Graham Dorrans', 'MID', 21), mk('Robert Koren', 'MID', 27), mk('Jason Koumas', 'MID', 26),
    mk('Roman Bednar', 'FWD', 25), mk('Ishmael Miller', 'FWD', 22), mk('Luke Moore', 'FWD', 22),
  ],
};
