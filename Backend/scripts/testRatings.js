import axios from "axios";
import ratingAlgorithm from "../utils/ratingAlgorithm.js";
const { calculateAllRatings } = ratingAlgorithm;

async function fetchChessCom(username) {
  try {
    const res = await axios.get(
      `https://api.chess.com/pub/player/${username}/stats`
    );
    const data = res.data;

    return {
      blitz: {
        rating: data.chess_blitz?.last?.rating || 0,
        gamesPlayed:
          data.chess_blitz?.record?.win +
            data.chess_blitz?.record?.loss +
            data.chess_blitz?.record?.draw || 0,
      },
      bullet: {
        rating: data.chess_bullet?.last?.rating || 0,
        gamesPlayed:
          data.chess_bullet?.record?.win +
            data.chess_bullet?.record?.loss +
            data.chess_bullet?.record?.draw || 0,
      },
      rapid: {
        rating: data.chess_rapid?.last?.rating || 0,
        gamesPlayed:
          data.chess_rapid?.record?.win +
            data.chess_rapid?.record?.loss +
            data.chess_rapid?.record?.draw || 0,
      },
    };
  } catch (err) {
    console.error("Chess.com API error:", err.message);
    return null;
  }
}

async function fetchLichess(username) {
  try {
    const res = await axios.get(`https://lichess.org/api/user/${username}`);
    const perfs = res.data.perfs;
    return {
      blitz: {
        rating: perfs.blitz?.rating || 0,
        gamesPlayed: perfs.blitz?.games || 0,
      },
      bullet: {
        rating: perfs.bullet?.rating || 0,
        gamesPlayed: perfs.bullet?.games || 0,
      },
      rapid: {
        rating: perfs.rapid?.rating || 0,
        gamesPlayed: perfs.rapid?.games || 0,
      },
    };
  } catch (err) {
    console.error("Lichess API error:", err.message);
    return null;
  }
}

async function test() {
  const chessComUser = "unhinged007";
  const lichessUser = "kaustubh_790";

  const chessComData = await fetchChessCom(chessComUser);
  const lichessData = await fetchLichess(lichessUser);

  console.log("Chess.com Data:", chessComData);
  console.log("Lichess Data:", lichessData);

  const calculated = calculateAllRatings(lichessData, chessComData);
  console.log("Calculated Unified Ratings:", calculated);
}

test();
