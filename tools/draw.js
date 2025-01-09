import * as mpcCompute from './compute.js';

export function drawBSpline(controlPoints,canvas,newStart=True) {
    const ctx = canvas.getContext('2d');

    let degree = Math.min(controlPoints.length-1, 3);
    const knots=mpcCompute.computeKnot(controlPoints,degree);
    // Draw control points
    //ctx.fillStyle = 'red';
    //controlPoints.forEach(point => {
    //    ctx.beginPath();
    //    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    //    ctx.fill();
    //});

    // Draw the B-spline curve
    if (newStart){
    ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
    }


    let result = [];
    for (let t = 0; t <= 1.00; t += 0.005) {
        const point = mpcCompute.interpolate(t, degree, controlPoints.map(p => [p.x, p.y]), knots);
        ctx.lineTo(point[0], point[1]);
    let lastPt=controlPoints.slice(-1)
    ctx.lineTo(lastPt.x,lastPt.y)
  }



}
export function drawContour(mpc,canvas) {
  //ctx.width=ctx.width;
  const ctx = canvas.getContext('2d');

  let geomPts=mpcCompute.ptCoords(mpc);
  let S=geomPts.S;
  let O=geomPts.O;
  let A=geomPts.A;
  let D=geomPts.D;
  let F=geomPts.F;
  let P=geomPts.P;
  let E=geomPts.E;
  let Q=geomPts.Q;
  let W=geomPts.W;
  let phi=geomPts.phi;
  let Kl=geomPts.Kl;
  let G=geomPts.G;
  ctx.clearRect(-canvas.width, -canvas.height, 2*canvas.width, 2*canvas.height);

  // draw line QS

  //draw facing curve
  
  let facingCirc=mpcCompute.threePtCirc(S,O,D);

  let SAngle = Math.atan2(S.y - facingCirc.centerY, S.x - facingCirc.centerX); // Tangent angle at S
  let DAngle = Math.atan2(D.y - facingCirc.centerY, D.x - facingCirc.centerX); // Angle to D from circle center
  let OAngle = Math.atan2(O.y - facingCirc.centerY, O.x - facingCirc.centerX);

  //draw beak and left edge
  let beakCirc=mpcCompute.threePtCirc(F,E,P);
  let C=mpcCompute.lineCircIntersect(beakCirc,A,Math.tan(Math.PI-phi));

  let FAngle=Math.atan2(F.y - beakCirc.centerY, F.x - beakCirc.centerX);
  let CAngle=Math.atan2(C.y - beakCirc.centerY, C.x - beakCirc.centerX);
  let roundControlPts=[{x:mpc.topBoreDis, y:mpc.borePosition},{x:Math.min(mpc.topBoreDis,mpc.innerRadius), y:W.y},W]
  

  ctx.setLineDash([]);
  ctx.strokeStyle = "black";

  ctx.beginPath();
  ctx.moveTo(mpc.innerRadius, 0);
  ctx.lineTo(mpc.innerRadius, mpc.borePosition);
  ctx.lineTo(mpc.topBoreDis, mpc.borePosition);
  drawBSpline(roundControlPts,canvas,false)
  ctx.lineTo(Q.x, Q.y);
  ctx.stroke();
  ctx.closePath(); // Ensures the path is closed if not already
  ctx.fillStyle = "rgb(0 0 0 / 10%)"; // Set the fill color
  ctx.fill(); // Fill the inside of the shape



  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(C.x, C.y);
  ctx.arc(beakCirc.centerX, beakCirc.centerY, beakCirc.radius, CAngle, FAngle);
  ctx.lineTo(D.x, D.y);
  ctx.arc(facingCirc.centerX, facingCirc.centerY, facingCirc.radius, DAngle, OAngle,1);

  let bafflePts=mpc.Bs.filter(element => element.enabled);
  bafflePts.unshift(O);
  bafflePts.push(Kl);
  
  drawBSpline(bafflePts,canvas,false);
  ctx.lineTo(Kl.x,Kl.y)
  ctx.lineTo(-mpc.innerRadius, mpc.borePosition);
  ctx.lineTo(-mpc.innerRadius, 0);
  ctx.stroke();
  ctx.closePath(); // Ensures the path is closed if not already
  ctx.fill(); // Fill the inside of the shape

  ctx.beginPath();
  ctx.setLineDash([2, 2]);
  ctx.arc(facingCirc.centerX, facingCirc.centerY, facingCirc.radius, SAngle, OAngle);
  ctx.moveTo(S.x, S.y);
  ctx.lineTo(W.x, W.y);
  ctx.stroke();


  ctx.beginPath();
  ctx.arc(beakCirc.centerX, beakCirc.centerY, beakCirc.radius+1.2, CAngle, FAngle);
  ctx.strokeStyle = "red";
  ctx.stroke();


  ctx.setLineDash([0.2, 1]);
  ctx.strokeStyle = "grey";

  for (let i = 0; i < mpc.numOfInternalPt; i++) {
    
    ctx.beginPath(); // Start a new path
    ctx.moveTo(50, mpc.Ts[i].y);
    ctx.lineTo(mpc.Ts[i].x, mpc.Ts[i].y); // Move to the top point
    ctx.lineTo(mpc.Bs[i].x, mpc.Bs[i].y); // Draw a line to the bottom point
    ctx.stroke(); // Render the line
  }
  mpc.Bs.forEach(point => {
    if (point.enabled){
    ctx.beginPath();
    ctx.arc(point.x, point.y, 0.5, 0, Math.PI * 2);
    ctx.fill();};
  });
}