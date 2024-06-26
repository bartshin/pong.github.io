import ObservableObject from "@/lib/observable_object.js";
import GameData from "@/data/game_data.js";
import { GameMap, examples }  from "@/data/game_map.js";

/** @typedef {(params: {
 * speed?: number,
 * map?: any,
 * nicknames?: string[]
 * }) => void } SetGameParameter */

export const DEBUG = (() => {
  let isDebug = false;

  return ({
    isDebug: () => isDebug,
    setDebug: /** @param {boolean}debug */ 
    (debug) => isDebug = debug,
  });
})();

export const STATE = (() => {
  let isPlayingGame = false;
  /** @type {(() => Promise<boolean>) | null} */
  let cancelGameCallback = null;
  let isRequestPending = false;

  return ({
    isPlayingGame: () => isPlayingGame,
    setPlayingGame: /** @param {boolean} play*/ 
    (play) => isPlayingGame = play,
    /** @type {() => Promise<boolean>} */
    requestCancelGame: () => {
      if (isRequestPending)
        return Promise.resolve(false);
      else if (cancelGameCallback) {
        isRequestPending = true;
        return (cancelGameCallback()
          .then(res => {
            isRequestPending = false
            return res;
          }
          ));
      }
      return Promise.resolve(true);
    },
    setCancelGameCallback: 
    /** @param{(() => Promise<boolean>) | null} callback */
    (callback) => cancelGameCallback = callback
  })
})();

const globalData = (() =>{
  const hash = window.location.hash.trim();
  let isTournament = (hash && hash.startsWith("#tournament"));
  const numberOfPlayers = isTournament ? 
    parseInt(hash.replace("#tournament", ""))
    :2;

  /** @type { GameData | null } */ //@ts-ignore
  let gameData = new ObservableObject(
    isTournament ?
    GameData.createTournamentGame({
      nicknames: [...Array(numberOfPlayers).keys()].map(i => (i + 1) + "p"),
    peddleSpeed: 1.0,
    powerUp: true,
    })
    :
    GameData.createLocalGame({
    nicknames: ["1p", "2p"],
    peddleSpeed: 1.0,
    powerUp: true,
    })
  );
  let mapIndex = 2;
  const hashIndex = hash.replace("#", "");
  if (hash && ["0", "1", "2", "3", "4"].indexOf(hashIndex) != -1) {
    mapIndex = parseInt(hashIndex);
  }
  else {
    mapIndex = Math.floor(Math.random() * examples.length);
  }
  /** @type { GameMap| null } */
  let gameMap = examples[mapIndex].map;

  const gameParameter = {
    peddleSpeed: 1.0,
    nicknames: null,
    walls: null,
    powerUp: null
  };

  /** @param {{
   * speed?: number,
   * map?: any,
   * nicknames?: string[],
   * powerUp: boolean
   * }} params */
  const setGameParameter = ({
    speed, map, nicknames, powerUp
  }) => {
    if (speed != null && speed != undefined && typeof(speed) == "number" 
      && speed > 0 && speed < 5) {
      gameParameter.peddleSpeed = 1.0 + (speed - 2.5) * 0.1;
    }
    if (map) {
      const walls = JSON.parse(map);
      gameParameter.walls = walls;
    }

    if (Boolean(nicknames) && Array.isArray(nicknames) && nicknames.length > 0 &&
      nicknames.findIndex(name => (typeof(name) != "string") || name.trim().length == 0) == -1) {
      gameParameter.nicknames = nicknames; 
    }
    if (powerUp != null && powerUp != undefined)
      gameParameter.powerUp = powerUp;
  };

  const isParameterValid = () => {
    if (gameParameter.nicknames == null) {
      console.error("nicknames not set setGameParameter({nicknames})");
      return false;
    }
    else if (gameParameter.walls == null) {
      console.error("map not set setGameParameter({map})");
      return false;
    }
    else if (gameParameter.powerUp == null) {
      console.error("powerUp not set setGameParameter({powerUp})");
      return false;
    }
    return true;
  }

  const registerLocalGame = () => {
    if (!isParameterValid())
      throw "registerLocalGame";
    else if (gameParameter.nicknames.length < 2) {
      console.error(`nicknames.length = ${gameParameter.nicknames}`);
      throw "registerLocalGame";
    }
    gameData = new ObservableObject(GameData.createLocalGame(gameParameter));
    gameMap = GameMap.createFromWalls(gameParameter.walls);
    gameParameter.nicknames = null;
    gameParameter.walls = null;
    gameParameter.powerUp = null;
  };

  const registerTournamentGame = () => {
    if (!isParameterValid())
      throw "registerLocalGame";
    else if (gameParameter.nicknames.length < 3) {
      console.error(`nicknames.length = ${gameParameter.nicknames}`);
      throw "registerLocalGame";
    }
    gameMap = GameMap.createFromWalls(gameParameter.walls);
    gameData = new ObservableObject(GameData.createTournamentGame(gameParameter));
    gameParameter.nicknames = null;
    gameParameter.walls = null;
    gameParameter.powerUp = null;
  }

  const removeGame = () => { 
    gameData = null; 
    gameMap = null;
  };

  const createMap = () => {
    gameMap = GameMap.createFromWalls(gameParameter.walls);
    return gameMap;
  }

  let recordUser = null;
  const record = {
    getUsername: () => {
      return recordUser;
    },
    setUsername: (user) => {
      recordUser = user
    }
  };

  return ({ 
    gameData: () => gameData, 
    gameMap: () => gameMap ?? createMap(),
    registerLocalGame,
    registerTournamentGame, 
    removeGame, 
    setGameParameter,
    record, 
  });
})();

export default globalData;
export const Types = {};

