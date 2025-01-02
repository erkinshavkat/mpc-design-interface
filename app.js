// The interpolate function provided
function interpolate(t, degree, points, knots, weights, result) {

  var i,j,s,l;              // function-scoped iteration variables
  var n = points.length;    // points count
  var d = points[0].length; // point dimensionality

  if(degree < 1) throw new Error('degree must be at least 1 (linear)');
  if(degree > (n-1)) throw new Error('degree must be less than or equal to point count - 1');

  if(!weights) {
    // build weight vector of length [n]
    weights = [];
    for(i=0; i<n; i++) {
      weights[i] = 1;
    }
  }

  if(!knots) {
    // build knot vector of length [n + degree + 1]
    var knots = [];
    for(i=0; i<n+degree+1; i++) {
      knots[i] = i;
    }
  } else {
    if(knots.length !== n+degree+1) throw new Error('bad knot vector length');
  }

  var domain = [
    degree,
    knots.length-1 - degree
  ];

  // remap t to the domain where the spline is defined
  var low  = knots[domain[0]];
  var high = knots[domain[1]];
  t = t * (high - low) + low;

  if(t < low || t > high) throw new Error('out of bounds');

  // find s (the spline segment) for the [t] value provided
  for(s=domain[0]; s<domain[1]; s++) {
    if(t >= knots[s] && t <= knots[s+1]) {
      break;
    }
  }

  // convert points to homogeneous coordinates
  var v = [];
  for(i=0; i<n; i++) {
    v[i] = [];
    for(j=0; j<d; j++) {
      v[i][j] = points[i][j] * weights[i];
    }
    v[i][d] = weights[i];
  }

  // l (level) goes from 1 to the curve degree + 1
  var alpha;
  for(l=1; l<=degree+1; l++) {
    // build level l of the pyramid
    for(i=s; i>s-degree-1+l; i--) {
      alpha = (t - knots[i]) / (knots[i+degree+1-l] - knots[i]);

      // interpolate each component
      for(j=0; j<d+1; j++) {
        v[i][j] = (1 - alpha) * v[i-1][j] + alpha * v[i][j];
      }
    }
  }

  // convert back to cartesian and return
  var result = result || [];
  for(i=0; i<d; i++) {
    result[i] = v[s][i] / v[s][d];
  }

  return result;
}


// Initial control points (with default y values)
let mpc;
// B-spline settings
function computeKnot(controlPoints,m){
  N=controlPoints.length;

  const coreArray = Array.from({ length: N - m + 1 }, (_, i) => i);

// Step 2: Append m zeros to the beginning
  const startPadding = Array(m).fill(0);

// Step 3: Append m [N-m]s to the end
  const endPadding = Array(m).fill(N - m);

// Combine the arrays
  return [...startPadding, ...coreArray, ...endPadding];  
}
const canvas = document.getElementById('bsplineCanvas');
const ctx = canvas.getContext('2d');
const factor=10;
canvas.width=canvas.width*factor;
canvas.height=canvas.height*factor;
ctx.setTransform(factor, 0, 0, factor, 0, 0);
ctx.translate(0,(canvas.height/2)/factor);
ctx.rotate(3*Math.PI/2);
ctx.lineWidth=2/factor;

const boreCanvas = document.getElementById('chamberCanvas');
const bctx = boreCanvas.getContext('2d');
boreCanvas.width=boreCanvas.width*factor;
boreCanvas.height=boreCanvas.height*factor;
bctx.setTransform(factor, 0, 0, factor, 0, 0);
bctx.translate((boreCanvas.height/2)/factor,(boreCanvas.height/2)/factor);
bctx.lineWidth=2/factor;



// Update control points based on slider values

// Draw the B-spline curve
function drawBSpline(controlPoints,newStart=True) {
    
  if (controlPoints.length==2) {
    degree=1;
  } else if (controlPoints.length==3) {
      degree=2;
  } else {
      degree =3;
  }
  const knots=computeKnot(controlPoints,degree);
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
      const point = interpolate(t, degree, controlPoints.map(p => [p.x, p.y]), knots);
      ctx.lineTo(point[0], point[1]);
  lastPt=controlPoints.slice(-1)
  ctx.lineTo(lastPt.x,lastPt.y)
  }



}
function windowVertex(mpc) {
  const H = mpc.totalLength - mpc.tipRailWidth;
  const l = mpc.windowTopWidth;
  const e = mpc.ellipCurveGap;

  const y_top = H - 0.5 * Math.sqrt(-Math.pow(l, 2) + 4 * Math.pow(e / 2 + 0.5 * Math.sqrt(Math.pow(e, 2) + Math.pow(l, 2)), 2)) + e;
  const x_top = l / 2;

  return {x: x_top, y:y_top };
}
function threePtCirc(A, B, C) {
  const { x: x1, y: y1 } = A;
  const { x: x2, y: y2 } = B;
  const { x: x3, y: y3 } = C;

  // Coefficients for the linear equations
  const a1 = x2 - x1;
  const b1 = y2 - y1;
  const c1 = 0.5 * (x2 ** 2 - x1 ** 2 + y2 ** 2 - y1 ** 2);

  const a2 = x3 - x1;
  const b2 = y3 - y1;
  const c2 = 0.5 * (x3 ** 2 - x1 ** 2 + y3 ** 2 - y1 ** 2);

  // Determinants
  const det = a1 * b2 - a2 * b1;


  // Center (h, k)
  const h = (c1 * b2 - c2 * b1) / det;
  const k = (a1 * c2 - a2 * c1) / det;

  // Radius r
  const r = Math.sqrt((x1 - h) ** 2 + (y1 - k) ** 2);

  return { centerX: h, centerY:k , radius: r };
}
function lineCircIntersect(circle, point,slope,returnLargerY=false) {

  const h=circle.centerX;
  const k=circle.centerY;
  const r=circle.radius;
  const x1=point.x;
  const y1=point.y

  const m = slope; // Line slope
  const c = y1 - m * x1; // Line y-intercept

  // Coefficients of the quadratic equation
  const a = 1 + m ** 2;
  const b = -2 * h + 2 * m * (c - k);
  const cQuad = h ** 2 + (c - k) ** 2 - r ** 2;

  // Discriminant
  const discriminant = b ** 2 - 4 * a * cQuad;

  if (discriminant < 0) {
      return []; // No intersection
  }

  // Solve for x using the quadratic formula
  const xSolutions = [
      (-b + Math.sqrt(discriminant)) / (2 * a),
      (-b - Math.sqrt(discriminant)) / (2 * a),
  ];

  // Solve for y using the line equation
  const intersections = xSolutions.map(x => ({
      x,
      y: m * x + c,
  }));

  // If the discriminant is zero, return only one intersection
  if (discriminant === 0) {
      return [intersections[0]];
  }
  if (returnLargerY) {
    return intersections.reduce((maxPoint, point) => (point.y > maxPoint.y ? point : maxPoint));
  } else{
  return intersections.reduce((minPoint, point) => (point.y < minPoint.y ? point : minPoint));
  }
}
function ptCoords(mpc) {
  let Q={x:mpc.bottomOffsetX, y:mpc.bottomOffsetY};

  let A={x:-mpc.largestRad,y:mpc.shankLength};

  let phi=mpc.taperAngle;
  
  
  let Sy=mpc.totalLength-mpc.facingLength * Math.cos(mpc.theta);
  let S={x:tableSlope(Sy,mpc),y:Sy}
  
  let Dy=mpc.totalLength;
  let D={x:facingXCoord(Dy,mpc),y:Dy};

  let F={x:D.x-mpc.tipThickness, y:D.y};

  let P={x:-mpc.largestRad,y:mpc.biteEndingHeight};

  let Ey=mpc.totalLength-mpc.bitePosition;
  let E={x:tableSlope(Ey,mpc)-mpc.bitePositionThickness / Math.cos(mpc.theta),y:Ey}

  let Oy=mpc.totalLength-mpc.tipRailWidth;
  let O={x:facingXCoord(Oy,mpc),y:Oy};  

  let Wy=windowVertex(mpc).y-mpc.windowLength-mpc.windowBottomWidth/2;
  let W={x:tableSlope(Wy,mpc),y:Wy};
  
  let lenOG=(tableSlope(Oy,mpc)-O.x)*Math.cos(mpc.theta);

  let G={x:O.x+lenOG*Math.cos(mpc.theta),y:O.y+lenOG*Math.sin(mpc.theta)};
  let Kl={x:mpc.bottomBoreDis, y:mpc.borePosition};


  return {Q:Q, A:A, S:S, D:D , F:F, P:P, E:E, O:O, W:W,G:G, Kl:Kl, phi:phi}
}
function setupTs(mpc) {
  geomPts=ptCoords(mpc);

  let G= geomPts.G;

  let h=mpc.interpGridSize;
  let Ts = Array.from({ length:mpc.numOfInternalPt }, (_, n) =>({ 
    x:G.x+(n+1)*h*Math.sin(mpc.theta), 
    y:G.y-(n+1)*h*Math.cos(mpc.theta)}));
  mpc.Ts=Ts;
}

function drawContour(mpc) {
  //ctx.width=ctx.width;
  
  let geomPts=ptCoords(mpc);
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
  
  let facingCirc=threePtCirc(S,O,D);

  let SAngle = Math.atan2(S.y - facingCirc.centerY, S.x - facingCirc.centerX); // Tangent angle at S
  let DAngle = Math.atan2(D.y - facingCirc.centerY, D.x - facingCirc.centerX); // Angle to D from circle center
  let OAngle = Math.atan2(O.y - facingCirc.centerY, O.x - facingCirc.centerX);

  //draw beak and left edge
  let beakCirc=threePtCirc(F,E,P);
  let C=lineCircIntersect(beakCirc,A,Math.tan(Math.PI-phi));

  let FAngle=Math.atan2(F.y - beakCirc.centerY, F.x - beakCirc.centerX);
  let CAngle=Math.atan2(C.y - beakCirc.centerY, C.x - beakCirc.centerX);
  let roundControlPts=[{x:mpc.topBoreDis, y:mpc.borePosition},{x:Math.min(mpc.topBoreDis,mpc.innerRadius), y:W.y},W]
  
  bctx.beginPath();
  bctx.arc(0,0,12,0,2*Math.PI);
  bctx.stroke()

  ctx.setLineDash([]);
  ctx.strokeStyle = "black";

  ctx.beginPath();
  ctx.moveTo(mpc.innerRadius, 0);
  ctx.lineTo(mpc.innerRadius, mpc.borePosition);
  ctx.lineTo(mpc.topBoreDis, mpc.borePosition);
  drawBSpline(roundControlPts,newStart=false)
  ctx.lineTo(Q.x, Q.y);
  ctx.stroke();
  ctx.closePath(); // Ensures the path is closed if not already
  ctx.fillStyle = "rgb(0 0 0 / 20%)"; // Set the fill color
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
  
  drawBSpline(bafflePts,newStart=false);
  ctx.lineTo(Kl.x,Kl.y)
  ctx.lineTo(-mpc.innerRadius, mpc.borePosition);
  ctx.lineTo(-mpc.innerRadius, 0);
  ctx.stroke();
  ctx.closePath(); // Ensures the path is closed if not already
  ctx.fillStyle = "rgb(0 0 0 / 20%)"; // Set the fill color
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
  ctx.beginPath(); // Start a new path
  ctx.moveTo(O.x,O.y); // Move to the top point
  ctx.lineTo(G.x,G.y); // Draw a line to the bottom point
  ctx.stroke();
  for (let i = 0; i < mpc.numOfInternalPt; i++) {
    
    ctx.beginPath(); // Start a new path
    ctx.moveTo(mpc.Ts[i].x, mpc.Ts[i].y); // Move to the top point
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
function facingXCoord(z, mpc) {
  // Extracting values from the mpc object
  const Z0 = mpc.bottomOffsetY;
  const X0 = mpc.bottomOffsetX;
  const z0 = mpc.totalLength;

  // Calculating intermediate values
  const x0 = tableSlope(z0, mpc) - mpc.tipOpening;
  const breakZ = z0 - mpc.facingLength * Math.cos(mpc.tableAngle - Math.PI / 2);
  const z1 = breakZ;
  const x1 = tableSlope(z1, mpc);

  const g = -Math.tan(mpc.tableAngle - Math.PI / 2);

  const midz = (z0 + z1) / 2;
  const midx = (x0 + x1) / 2;

  const sec = (x1 - x0) / (z1 - z0);

  const X = -(midz + midx * sec - g * x1 - z1) / (g - sec);
  const Z = -((-g * midz - g * midx * sec + g * sec * x1 + sec * z1) / (g - sec));

  const r2 = Math.pow(x0 - X, 2) + Math.pow(z0 - Z, 2);

  // Conditional return based on z and breakZ
  if (z < breakZ) {
      return tableSlope(z, mpc);
  } else {
      return Math.sqrt(r2 - Math.pow(z - Z, 2)) + X;
  }
}
function tableSlope(z, mpc) {
  // Extracting values from the mpc object
  const Z0 = mpc.bottomOffsetY;
  const X0 = mpc.bottomOffsetX;

  // Calculating the slope
  return -Math.tan(mpc.tableAngle - Math.PI / 2) * (z - Z0) + X0;
}
function lsFromBs(mpc) {
  mpc.ls=mpc.Ts.map((tPoint, index) => {
  const bPoint = mpc.Bs[index];
  return Math.sqrt((tPoint.x - bPoint.x) ** 2 + (tPoint.y - bPoint.y) ** 2);
});
}
function Bsfromls(mpc) {
  mpc.Bs=mpc.Ts.map((tPoint, index) => {
  const l = mpc.ls[index];
  let bx=tPoint.x - l * Math.cos(mpc.theta);
  let by=tPoint.y - l * Math.sin(mpc.theta);
  return {
      x: bx,
      y: by,
    enabled:true};
})
}
const templateFile = {
  S:'templates/soprano.json',
  A:'templates/alto.json',
  T:'templates/tenor.json',
  B:'templates/baritone.json'
}
function toggleControlPoint(index, enabled,mpc) {
  mpc.Bs[index].enabled = enabled;
  drawContour(mpc);
}

function updateLsValue(index, l,mpc) {
  mpc.ls[index]=l;
  Bsfromls(mpc);
  drawContour(mpc);
}
let mpcType

function updateType(mpcType) {
 
  let fileName=templateFile[mpcType];
  // console.log(fileName)
  // Construct the URL for the JSON file
  // /home/hw/Documents/openmpcs/backendcode/code/mpcTemplates/
  fetch(fileName)
      .then(response => {
          if (!response.ok) {
              throw new Error(`Failed to load: ${response.statusText}`);
          }
          return response.json();
      })
      .then(data => {
          mpc=data;

          tipOpeningIn = data.defaultTip;
          mpc.facingLength = 25;
          mpc.topBoreDis=data.innerRadius*1.1;
          mpc.bottomBoreDis=-data.innerRadius*1.1;
          let ls=data.defaultLs;
          let maxFacing=data.totalLength-(windowVertex(data).y-data.windowLength-data.windowBottomWidth/2);
          mpc.tipOpening=tipOpeningIn*25.4/1000;
          mpc.ls=ls
          mpc.theta=mpc.tableAngle-Math.PI/2;
          setupTs(mpc)
          Bsfromls(mpc)
          document.getElementById('tipOpeningSlider').min=data.minTip;
          document.getElementById('tipOpeningSlider').max=data.maxTip;
          document.getElementById('facingLengthSlider').max=maxFacing;
          
          document.getElementById('tipOpeningSlider').value = tipOpeningIn;
          document.getElementById('facingLengthSlider').value = data.facingLength;
          document.getElementById('tipOpeningNumber').value = tipOpeningIn;
          document.getElementById('facingLengthNumber').value = data.facingLength;
          splineControlsDiv.innerHTML = "";
          setupBaffleControls(mpc);
          setupDragging(mpc);
          drawContour(mpc);

      })
}
function updateTip() {
  tipOpeningIn = parseInt(document.getElementById('tipOpeningSlider').value);
  mpc.facingLength = parseInt(document.getElementById('facingLengthSlider').value);
  mpc.tipOpening=tipOpeningIn*25.4/1000;
  document.getElementById('tipOpeningNumber').value = tipOpeningIn;
  document.getElementById('facingLengthNumber').value = mpc.facingLength;
  drawContour(mpc)
}
const splineControlsDiv = document.getElementById("splineControls");

function setupBaffleControls(mpc) {
  mpc.Bs.forEach((point, index) => {
      const controlDiv = document.createElement("div");
      controlDiv.className = "control-point";

      const label = document.createElement("label");
      label.textContent = `Point ${index + 1}: `;
      label.htmlFor = `input${index}`;

      const input = document.createElement("input");
      input.type = "number";
      input.value = mpc.ls[index];
      input.id = `input${index}`;
      input.addEventListener("input", (e) => {
          const newValue = parseInt(e.target.value, 10);
          let clippedValue=Math.max(0,Math.min(newValue,computeMaxl(index,mpc)));
          let l=Math.round(clippedValue*20)/20
          updateLsValue(index, l,mpc);
          input.value=l;
      });

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = point.enabled;
      checkbox.id = `checkbox${index}`;
      checkbox.addEventListener("change", (e) => {
          toggleControlPoint(index, e.target.checked,mpc);
      });

      const checkboxLabel = document.createElement("label");
      checkboxLabel.textContent = " Enable";
      checkboxLabel.htmlFor = `checkbox${index}`;

      controlDiv.appendChild(label);
      controlDiv.appendChild(input);
      controlDiv.appendChild(checkbox);
      controlDiv.appendChild(checkboxLabel);

      splineControlsDiv.appendChild(controlDiv);
  });
}
function closestPointOnLine(x, y, mpc,index) {
  const x0=mpc.Ts[index].x;
  const y0=mpc.Ts[index].y;
  const m=Math.tan(mpc.tableAngle-Math.PI/2);
  const dx = 1;
  const dy = m;
  const t = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
  return {
      x: x0 + t * dx,
      y: y0 + t * dy
  };
}

function deTransformMouseCoord(x,y) {
  const transform = ctx.getTransform(); // Current transformation matrix
  const inverseMatrix = transform.invertSelf(); // Inverse matrix

  // Apply the inverse transformation
  const preTransformedX = inverseMatrix.a * x + inverseMatrix.c * y + inverseMatrix.e;
  const preTransformedY = inverseMatrix.b * x + inverseMatrix.d * y + inverseMatrix.f;

  return { x: preTransformedX, y: preTransformedY };
}

function computeMaxl(index,mpc) {
  //compute that max l at T[index]

  let geomPts=ptCoords(mpc);
  let beakCirc=threePtCirc(geomPts.F,geomPts.E,geomPts.P);
  let tPoint=mpc.Ts[index];
  let intersection=lineCircIntersect(beakCirc,tPoint,Math.tan(mpc.theta),returnLargerY=true);
  let maxl= Math.hypot(intersection.y-tPoint.y,intersection.x-tPoint.x);
  return maxl-1
}

function computeLValue(nearestPt,index,mpc)  {
  // given the poitn nearest to the mouse on the TB line, compute the corresponding l, enforcing minimum = 0 and maximum = beakCirc  
  if (nearestPt.x>=tableSlope(nearestPt.y,mpc)){
    //clipping 0, if the point is to above the table
    return 0
  }
  let l=Math.hypot(nearestPt.y - mpc.Ts[index].y, nearestPt.x - mpc.Ts[index].x);
  let maxl= computeMaxl(index,mpc)
  return Math.min(maxl, l);
}

function setupDragging(mpc) {
  let draggingPoint = null;

  canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const rawMouseX = e.clientX - rect.left;
      const rawMouseY = e.clientY - rect.top;
      const mouse=deTransformMouseCoord(rawMouseX,rawMouseY);
      draggingPoint = mpc.Bs.find(
          point => point.enabled &&
              Math.hypot(point.x - mouse.x, point.y - mouse.y) < factor/10
      );
  });

  canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const rawMouseX = e.clientX - rect.left;
      const rawMouseY = e.clientY - rect.top;
      const mouse=deTransformMouseCoord(rawMouseX,rawMouseY);
      if (draggingPoint) {
          let ptIndex=mpc.Bs.indexOf(draggingPoint);
          let nearestPt=closestPointOnLine(mouse.x,mouse.y,mpc,ptIndex);
          //draggingPoint.x = nearestPt.x;
          //draggingPoint.y = nearestPt.y;
          let l=computeLValue(nearestPt,ptIndex,mpc);
          mpc.ls[ptIndex]=Math.round(l*20)/20;
          let theta=mpc.tableAngle-Math.PI/2;
          let tPoint=mpc.Ts[ptIndex];
          let bx=tPoint.x - l * Math.cos(theta);
          let by=tPoint.y - l * Math.sin(theta);
          draggingPoint.x=bx;
          draggingPoint.y=by;
          document.getElementById(`input${ptIndex}`).value = mpc.ls[ptIndex];
          drawContour(mpc);
      }
  });

  canvas.addEventListener("mouseup", () => {
      draggingPoint = null;
  });
}
document.getElementById('tipOpeningSlider').addEventListener('input', updateTip)
document.getElementById('facingLengthSlider').addEventListener('input', updateTip) 

document.getElementById('tipOpeningNumber').addEventListener('input', (e) => {
  let tipOpeningIn = parseInt(e.target.value, 10);
  if (tipOpeningIn >= document.getElementById('tipOpeningSlider').min && tipOpeningIn <= document.getElementById('tipOpeningSlider').max ){
  document.getElementById('tipOpeningSlider').value = tipOpeningIn;
  mpc.tipOpening=tipOpeningIn*25.4/1000;
  drawContour(mpc)
  };
});
document.getElementById('facingLengthNumber').addEventListener('input', (e) => {
  let facingLength = parseInt(e.target.value, 10);
  if (facingLength >= document.getElementById('facingLengthSlider').min && facingLength <= document.getElementById('facingLengthSlider').max ){

  document.getElementById('facingLengthSlider').value = parseInt(e.target.value, 10);
  mpc.facingLength=facingLength;
  drawContour(mpc)
  };
});
document.querySelectorAll('input[name="type"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
      let mpcType = event.target.value;
      // Call your existing functions here based on the selected value
      updateType(mpcType);
  });
});
updateType('S')