export function interpolate(t, degree, points, knots, weights, result) {

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
export function computeKnot(controlPoints,m){
    let N=controlPoints.length;
  
    const coreArray = Array.from({ length: N - m + 1 }, (_, i) => i);
  
  // Step 2: Append m zeros to the beginning
    const startPadding = Array(m).fill(0);
  
  // Step 3: Append m [N-m]s to the end
    const endPadding = Array(m).fill(N - m);
  
  // Combine the arrays
    return [...startPadding, ...coreArray, ...endPadding];  
  }
export function windowVertex(mpc) {
  const H = mpc.totalLength - mpc.tipRailWidth;
  const l = mpc.windowTopWidth;
  const e = mpc.ellipCurveGap;

  const y_top = H - 0.5 * Math.sqrt(-Math.pow(l, 2) + 4 * Math.pow(e / 2 + 0.5 * Math.sqrt(Math.pow(e, 2) + Math.pow(l, 2)), 2)) + e;
  const x_top = l / 2;

  return {x: x_top, y:y_top };
}
export function threePtCirc(A, B, C) {
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
export function lineCircIntersect(circle, point,slope,returnLargerY=false) {

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
export function ptCoords(mpc) {
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
export function setupTs(mpc) {
  let geomPts=ptCoords(mpc);

  let G= geomPts.G;

  let h=mpc.interpGridSize;
  let Ts = Array.from({ length:mpc.numOfInternalPt }, (_, n) =>({ 
    x:G.x+(n+1)*h*Math.sin(mpc.theta), 
    y:G.y-(n+1)*h*Math.cos(mpc.theta)}));
  mpc.Ts=Ts;
}
export function facingXCoord(z, mpc) {
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
export function tableSlope(z, mpc) {
    // Extracting values from the mpc object
    const Z0 = mpc.bottomOffsetY;
    const X0 = mpc.bottomOffsetX;
  
    // Calculating the slope
    return -Math.tan(mpc.tableAngle - Math.PI / 2) * (z - Z0) + X0;
  }
export function lsFromBs(mpc) {
    mpc.ls=mpc.Ts.map((tPoint, index) => {
    const bPoint = mpc.Bs[index];
    return Math.sqrt((tPoint.x - bPoint.x) ** 2 + (tPoint.y - bPoint.y) ** 2);
  });
  }
export function Bsfromls(mpc) {
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
export function closestPointOnLine(x, y, mpc,index) {
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
export function deTransformMouseCoord(x,y,canvas) {
  const ctx = canvas.getContext('2d');
  const transform = ctx.getTransform(); // Current transformation matrix
  const inverseMatrix = transform.invertSelf(); // Inverse matrix

  // Apply the inverse transformation
  const preTransformedX = inverseMatrix.a * x + inverseMatrix.c * y + inverseMatrix.e;
  const preTransformedY = inverseMatrix.b * x + inverseMatrix.d * y + inverseMatrix.f;

  return { x: preTransformedX, y: preTransformedY };
}
export function computeMaxl(index,mpc) {
  //compute that max l at T[index]

  let geomPts=ptCoords(mpc);
  let beakCirc=threePtCirc(geomPts.F,geomPts.E,geomPts.P);
  let tPoint=mpc.Ts[index];
  let intersection=lineCircIntersect(beakCirc,tPoint,Math.tan(mpc.theta),true);
  let maxl= Math.hypot(intersection.y-tPoint.y,intersection.x-tPoint.x);
  return maxl-1
}
export function computeLValue(nearestPt,index,mpc)  {
  // given the poitn nearest to the mouse on the TB line, compute the corresponding l, enforcing minimum = 0 and maximum = beakCirc  
  if (nearestPt.x>=tableSlope(nearestPt.y,mpc)){
    //clipping 0, if the point is to above the table
    return 0
  }
  let l=Math.hypot(nearestPt.y - mpc.Ts[index].y, nearestPt.x - mpc.Ts[index].x);
  let maxl= computeMaxl(index,mpc)
  return Math.min(maxl, l);
}
export function clipMinMax(x,minValue,maxValue) {
  return Math.max(minValue,Math.min(x,maxValue));
}