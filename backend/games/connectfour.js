export function create(){
  return { w:7, h:6, grid: Array(6).fill(0).map(()=>Array(7).fill(0)), turn:1, winner:0 };
}
export function move(s, col){
  if(s.winner) return s;
  for(let r=s.h-1;r>=0;r--){ if(s.grid[r][col]===0){ s.grid[r][col]=s.turn; break; } }
  if(checkWin(s)) s.winner = s.turn;
  s.turn = s.turn===1?2:1; return s;
}
function checkWin(s){
  const G=s.grid, H=s.h, W=s.w;
  const lines = [];
  for(let r=0;r<H;r++) for(let c=0;c<W-3;c++) lines.push([[r,c],[r,c+1],[r,c+2],[r,c+3]]);
  for(let r=0;r<H-3;r++) for(let c=0;c<W;c++) lines.push([[r,c],[r+1,c],[r+2,c],[r+3,c]]);
  for(let r=0;r<H-3;r++) for(let c=0;c<W-3;c++) lines.push([[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]]);
  for(let r=3;r<H;r++) for(let c=0;c<W-3;c++) lines.push([[r,c],[r-1,c+1],[r-2,c+2],[r-3,c+3]]);
  return lines.some(line => line.every(([r,c]) => G[r][c]!==0 && G[r][c]===G[line[0][0]][line[0][1]]));
}