import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "./components/Button";
import Square from "./components/Square";

function App() {
  const [squares, setSquares] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("x");
  const [winner, setWinner] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false); // To toggle AI on/off

  const checkEndTheGame = useCallback(() => {
    for (let square of squares) {
      if (!square) return false;
    }
    return true;
  }, [squares]);

  const checkWinner = useCallback(() => {
    const combos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let combo of combos) {
      const [a, b, c] = combo;
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  }, [squares]);

  const updateSquares = useCallback(
    (ind) => {
      if (squares[ind] || winner) {
        return;
      }
      const s = squares;
      s[ind] = turn;
      setSquares(s);
      setTurn(turn === "x" ? "o" : "x");
      const W = checkWinner();
      if (W) {
        setWinner(W);
      } else if (checkEndTheGame()) {
        setWinner("x | o");
      }
    },
    [squares, turn, winner, checkWinner, checkEndTheGame]
  );

  const scores = useMemo(
    () => ({
      x: -10,
      o: 10,
      tie: 0,
    }),
    []
  );

  //   const minimax = useCallback(
  //     (board, depth, alpha, beta, isMaximizing) => {
  //       const result = checkWinner();
  //       if (result !== null) {
  //         return scores[result];
  //       }

  //       if (depth >= 1) {
  //         // Add a maximum depth to the search
  //         return 0; // Evaluation function can be added here for more sophisticated AI
  //       }

  //       if (isMaximizing) {
  //         let bestScore = -Infinity;
  //         for (let i = 0; i < board.length; i++) {
  //           if (!board[i]) {
  //             board[i] = "o";
  //             const score = minimax(board, depth + 1, alpha, beta, false);
  //             board[i] = null;
  //             bestScore = Math.max(score, bestScore);
  //             alpha = Math.max(alpha, score);
  //             if (beta <= alpha) {
  //               break; // Beta cutoff
  //             }
  //           }
  //         }
  //         return bestScore;
  //       } else {
  //         let bestScore = Infinity;
  //         for (let i = 0; i < board.length; i++) {
  //           if (!board[i]) {
  //             board[i] = "x";
  //             const score = minimax(board, depth + 1, alpha, beta, true);
  //             board[i] = null;
  //             bestScore = Math.min(score, bestScore);
  //             beta = Math.min(beta, score);
  //             if (beta <= alpha) {
  //               break; // Alpha cutoff
  //             }
  //           }
  //         }
  //         return bestScore;
  //       }
  //     },
  //     [checkWinner, scores]
  //   );

  const evaluateBoard = useCallback((board) => {
    const combos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let combo of combos) {
      const [a, b, c] = combo;
      const line = [board[a], board[b], board[c]];

      // Check if the line has potential for a win or block
      if (line.includes(null) && line.filter((x) => x !== null).length === 2) {
        const uniqueValues = Array.from(new Set(line)); // Get unique values in the line
        if (uniqueValues.length === 2) {
          // If there's only one empty square and two identical marks, it's a potential win or block
          if (uniqueValues[0] === "o") return 10; // AI has a winning possibility
          if (uniqueValues[0] === "x") return -10; // Opponent has a winning possibility
        }
      }
    }

    return 0; // No immediate win or block
  }, []);

  const minimax = useCallback(
    (board, depth, alpha, beta, isMaximizing) => {
      const result = checkWinner();
      if (result !== null) {
        return scores[result];
      }

      if (depth >= 1) {
        // If the depth is 9, it means the board is full, return the evaluation
        return evaluateBoard(board);
      }

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
          if (!board[i]) {
            board[i] = "o";
            const score = minimax(board, depth + 1, alpha, beta, false);
            board[i] = null;
            bestScore = Math.max(score, bestScore);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
              break; // Beta cutoff
            }
          }
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
          if (!board[i]) {
            board[i] = "x";
            const score = minimax(board, depth + 1, alpha, beta, true);
            board[i] = null;
            bestScore = Math.min(score, bestScore);
            beta = Math.min(beta, score);
            if (beta <= alpha) {
              break; // Alpha cutoff
            }
          }
        }
        return bestScore;
      }
    },
    [scores, checkWinner, evaluateBoard]
  );

  const makeAIMove = useCallback(() => {
    const emptySquares = squares.reduce((acc, val, index) => {
      if (!val) acc.push(index);
      return acc;
    }, []);

    let bestScore = -Infinity;
    let bestMove;

    emptySquares.forEach((move) => {
      const boardCopy = [...squares];
      boardCopy[move] = "o";

      // Call minimax with a depth of 0 and isMaximizing as false since it's the player's (AI's) turn
      const score = minimax(boardCopy, 0, -Infinity, Infinity, false);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    if (bestMove !== undefined) {
      // Once the best move is determined, update the squares
      updateSquares(bestMove);
    }
  }, [squares, minimax, updateSquares]);

  useEffect(() => {
    if (aiEnabled && turn === "o" && !winner) {
      const aiMoveTimeout = setTimeout(() => {
        makeAIMove();
      }, 1000); // Adjust the delay as needed
      return () => clearTimeout(aiMoveTimeout);
    }
  }, [aiEnabled, squares, turn, winner, makeAIMove]);

  const resetGame = () => {
    setSquares(Array(9).fill(""));
    setTurn("x");
    setWinner(null);
  };

  const toggleAI = () => {
    setAiEnabled(!aiEnabled);
    if (!aiEnabled && turn === "o") {
      makeAIMove(); // If AI is toggled on and it's AI's turn, make a move immediately
    }
  };

  return (
    <div className="tic-tac-toe">
      <h1> TIC-TAC-TOE </h1>
      <Button resetGame={resetGame} />
      <button onClick={toggleAI}>{aiEnabled ? "Human" : "AI"}</button>

      <div className="game">
        {Array.from("012345678").map((ind) => (
          <Square
            key={ind}
            ind={ind}
            updateSquares={updateSquares}
            clsName={squares[ind]}
          />
        ))}
      </div>
      <div className={`turn ${turn === "x" ? "left" : "right"}`}>
        <Square clsName="x" />
        <Square clsName="o" />
      </div>
      <AnimatePresence>
        {winner && (
          <motion.div
            key={"parent-box"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="winner"
          >
            <motion.div
              key={"child-box"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text"
            >
              <motion.h2
                initial={{ scale: 0, y: 100 }}
                animate={{
                  scale: 1,
                  y: 0,
                  transition: {
                    y: { delay: 0.7 },
                    duration: 0.7,
                  },
                }}
              >
                {winner === "x | o" ? "No Winner :/" : "Win !! :)"}
              </motion.h2>
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  transition: {
                    delay: 1.3,
                    duration: 0.2,
                  },
                }}
                className="win"
              >
                {winner === "x | o" ? (
                  <>
                    <Square clsName="x" />
                    <Square clsName="o" />
                  </>
                ) : (
                  <>
                    <Square clsName={winner} />
                  </>
                )}
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  transition: { delay: 1.5, duration: 0.3 },
                }}
              >
                <Button resetGame={resetGame} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
