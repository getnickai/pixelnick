/** Project a rectangular UI onto the four photographed screen corners. */
export function screenMatrix(width: number, height: number, points: number[][]): number[] {
  if (!(width > 0 && height > 0) || points.length !== 4 || points.some((p) => p.length !== 2) || !points.flat().every(Number.isFinite)) throw new Error('Invalid screen geometry');
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = points;
  const dx1=x1-x2, dx2=x3-x2, dx3=x0-x1+x2-x3;
  const dy1=y1-y2, dy2=y3-y2, dy3=y0-y1+y2-y3;
  const det=dx1*dy2-dx2*dy1;
  if (Math.abs(det)<1e-8) throw new Error('Degenerate screen plane');
  const g=(dx3*dy2-dx2*dy3)/det, h=(dx1*dy3-dx3*dy1)/det;
  return [(x1-x0+g*x1)/width,(y1-y0+g*y1)/width,0,g/width,(x3-x0+h*x3)/height,(y3-y0+h*y3)/height,0,h/height,0,0,1,0,x0,y0,0,1];
}
