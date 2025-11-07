export function create(){
  return { board: Array(9).fill(null), turn: 'X', winner: null };
}
export function move(state, i){
  if(state.winner || state.board[i]) return state;
  state.board[i] = state.turn;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  if(wins.some(w=> w.every(x=> state.board[x]===state.turn))) state.winner = state.turn;
  state.turn = state.turn === 'X' ? 'O' : 'X';
  return state;
}