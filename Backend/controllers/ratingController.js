import axios from "axios";
import User from "../models/User.js";
import ratingAlgorithm from "../utils/ratingAlgorithm.js";
const { calculateAllRatings } = ratingAlgorithm;

export const updateChessRatings = async (req, res) => {
  try {
    const { userId, chessCom, lichess } = req.body;

    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let chessComData = null;
    let lichessData = null;
    const syncTime = new Date();

    // Fetch from Chess.com
    if (chessCom) {
      try {
        const chessComRes = await axios.get(
          `https://api.chess.com/pub/player/${chessCom}/stats`
        );
        const data = chessComRes.data;

        chessComData = {
          blitz: {
            rating: data.chess_blitz?.last?.rating || 0,
            gamesPlayed:
              (data.chess_blitz?.record?.win || 0) +
              (data.chess_blitz?.record?.loss || 0) +
              (data.chess_blitz?.record?.draw || 0),
          },
          bullet: {
            rating: data.chess_bullet?.last?.rating || 0,
            gamesPlayed:
              (data.chess_bullet?.record?.win || 0) +
              (data.chess_bullet?.record?.loss || 0) +
              (data.chess_bullet?.record?.draw || 0),
          },
          rapid: {
            rating: data.chess_rapid?.last?.rating || 0,
            gamesPlayed:
              (data.chess_rapid?.record?.win || 0) +
              (data.chess_rapid?.record?.loss || 0) +
              (data.chess_rapid?.record?.draw || 0),
          },
        };

        user.chessAccounts = user.chessAccounts || {};
        user.chessAccounts.chessCom = user.chessAccounts.chessCom || {
          ratings: {},
        };
        user.chessAccounts.chessCom.username = chessCom;
        user.chessAccounts.chessCom.ratings.blitz =
          chessComData.blitz.rating || 0;
        user.chessAccounts.chessCom.ratings.bullet =
          chessComData.bullet.rating || 0;
        user.chessAccounts.chessCom.ratings.rapid =
          chessComData.rapid.rating || 0;
        user.chessAccounts.chessCom.lastSync = syncTime;
      } catch (err) {
        console.error("Error fetching Chess.com:", err.message);
      }
    }

    // Fetch from Lichess
    if (lichess) {
      try {
        const lichessRes = await axios.get(
          `https://lichess.org/api/user/${lichess}`
        );
        const perfs = lichessRes.data.perfs || {};

        lichessData = {
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

        user.chessAccounts = user.chessAccounts || {};
        user.chessAccounts.lichess = user.chessAccounts.lichess || {
          ratings: {},
        };
        user.chessAccounts.lichess.username = lichess;
        user.chessAccounts.lichess.ratings.blitz =
          lichessData.blitz.rating || 0;
        user.chessAccounts.lichess.ratings.bullet =
          lichessData.bullet.rating || 0;
        user.chessAccounts.lichess.ratings.rapid =
          lichessData.rapid.rating || 0;
        user.chessAccounts.lichess.lastSync = syncTime;
      } catch (err) {
        console.error("Error fetching Lichess:", err.message);
      }
    }

    // Unified rating calculation
    const chessComForCalc = chessComData || {
      blitz: {
        rating: user.chessAccounts.chessCom?.ratings?.blitz || 0,
        gamesPlayed: 0,
      },
      bullet: {
        rating: user.chessAccounts.chessCom?.ratings?.bullet || 0,
        gamesPlayed: 0,
      },
      rapid: {
        rating: user.chessAccounts.chessCom?.ratings?.rapid || 0,
        gamesPlayed: 0,
      },
    };

    const lichessForCalc = lichessData || {
      blitz: {
        rating: user.chessAccounts.lichess?.ratings?.blitz || 0,
        gamesPlayed: 0,
      },
      bullet: {
        rating: user.chessAccounts.lichess?.ratings?.bullet || 0,
        gamesPlayed: 0,
      },
      rapid: {
        rating: user.chessAccounts.lichess?.ratings?.rapid || 0,
        gamesPlayed: 0,
      },
    };

    const calculatedRatings = calculateAllRatings(
      lichessForCalc,
      chessComForCalc
    );

    user.calculatedElo = user.calculatedElo || {};
    user.calculatedElo.blitz = calculatedRatings.blitz;
    user.calculatedElo.bullet = calculatedRatings.bullet;
    user.calculatedElo.rapid = calculatedRatings.rapid;
    user.calculatedElo.lastCalculated = syncTime;

    await user.save();

    const updatedUser = await User.findById(userId);
    res.json({ message: "Ratings updated successfully", updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
