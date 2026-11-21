import { Movie, Cinema } from '../types';

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'm-iron-man',
    title: 'Iron Man',
    releaseYear: 2008,
    runtimeMinutes: 126,
    watched: true,
    prerequisiteIds: [],
  },
  {
    id: 'm-first-avenger',
    title: 'Captain America: The First Avenger',
    releaseYear: 2011,
    runtimeMinutes: 124,
    watched: true,
    prerequisiteIds: [],
  },
  {
    id: 'm-the-avengers',
    title: 'The Avengers',
    releaseYear: 2012,
    runtimeMinutes: 143,
    watched: true,
    prerequisiteIds: ['m-iron-man', 'm-first-avenger'],
  },
  {
    id: 'm-civil-war',
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtimeMinutes: 147,
    watched: false,
    prerequisiteIds: ['m-the-avengers'],
  },
  {
    id: 'm-ragnarok',
    title: 'Thor: Ragnarok',
    releaseYear: 2017,
    runtimeMinutes: 130,
    watched: true,
    prerequisiteIds: [],
  },
  {
    id: 'm-infinity-war',
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtimeMinutes: 149,
    watched: false,
    prerequisiteIds: ['m-civil-war', 'm-ragnarok'],
  },
  {
    id: 'm-endgame',
    title: 'Avengers: Endgame',
    releaseYear: 2019,
    runtimeMinutes: 181,
    watched: false,
    prerequisiteIds: ['m-infinity-war'],
  },
  {
    id: 'm-doomsday',
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtimeMinutes: 180,
    watched: false,
    prerequisiteIds: ['m-endgame'],
  },
];

export const INITIAL_CINEMAS: Cinema[] = [
  {
    id: 'c-stark-imax',
    name: 'Stark IMAX Theatre',
    bundleSizes: [2, 5],
  },
  {
    id: 'c-odin-odeon',
    name: 'Odin Odeon Screen',
    bundleSizes: [6, 9, 20],
  },
  {
    id: 'c-sanctum-cinema',
    name: 'Sanctum Sanctorum Cinema',
    bundleSizes: [4, 6],
  },
];

