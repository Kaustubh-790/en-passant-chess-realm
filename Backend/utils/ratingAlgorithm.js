const MIN_RELIABLE_GAMES = 50;
const LICHESS_TO_CHESSCOM_DIFF = 300;
const CAUTION_FACTOR = 0.9;

// Calculates unified rating for one time control (blitz/bullet/rapid)
function calculateDisplayRating(lichess, chesscom) {
  const { rating: lichessRating = 0, gamesPlayed: lichessGames = 0 } =
    lichess || {};
  const { rating: chessRating = 0, gamesPlayed: chessGames = 0 } =
    chesscom || {};

  const lichessAsChesscom = lichessRating - LICHESS_TO_CHESSCOM_DIFF;

  const reliableLichess = lichessGames >= MIN_RELIABLE_GAMES;
  const reliableChess = chessGames >= MIN_RELIABLE_GAMES;

  if (reliableChess && !reliableLichess) return chessRating;
  if (reliableLichess && !reliableChess) return lichessAsChesscom;
  if (reliableLichess && reliableChess) {
    const totalGames = lichessGames + chessGames;
    const weighted =
      (lichessAsChesscom * lichessGames + chessRating * chessGames) /
      totalGames;
    return Math.round(weighted);
  }

  const betterRating = Math.max(chessRating, lichessAsChesscom);
  return Math.round(betterRating * CAUTION_FACTOR);
}

// Calculates unified ratings for all formats
function calculateAllRatings(lichess, chesscom) {
  const formats = ["blitz", "bullet", "rapid"];
  const result = {};

  for (const format of formats) {
    result[format] = calculateDisplayRating(
      lichess?.[format],
      chesscom?.[format]
    );
  }

  return result;
}

export default { calculateDisplayRating, calculateAllRatings };
