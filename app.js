import * as mpcCompute from './tools/compute.js';

import * as mpcDraw from './tools/draw.js';

// Initial control points (with default y values)
let mpc={};
// B-spline settings

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

const tipOpeningSlider=document.getElementById('tipOpeningSlider');
const tipOpeningNumber=document.getElementById('tipOpeningNumber');
const tipOpeningControls=[tipOpeningSlider,tipOpeningNumber]

const facingLengthSlider=document.getElementById('facingLengthSlider');
const facingLengthNumber=document.getElementById('facingLengthNumber');
const facingLengthControls=[facingLengthSlider,facingLengthNumber];

const typeSelector=document.querySelectorAll('input[name="type"]');
const boreSelector=document.querySelectorAll('input[name="boreType"]');

const splineControlsDiv = document.getElementById("splineControls");
const boreControlsDiv = document.getElementById("boreControls");

function syncValue(value, elements) {
  elements.forEach(element => {element.value = value;});
}

// Update control points based on slider values

// Draw the B-spline curve

typeSelector.forEach((radio) => {
  radio.addEventListener('change', (event) => {
      let mpcType = event.target.value;

      // Call your existing functions here based on the selected value
      typeChange(mpcType);
  });
});

function typeChange(mpcType) {
  splineControlsDiv.innerHTML = "";
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

          let tipOpeningIn = data.defaultTip;
          mpc.facingLength = 25;
          mpc.topBoreDis=data.innerRadius;
          mpc.bottomBoreDis=-data.innerRadius;
          let ls=data.defaultLs;
          let maxFacing=data.totalLength-(mpcCompute.windowVertex(data).y-data.windowLength-data.windowBottomWidth/2);
          mpc.tipOpening=tipOpeningIn*25.4/1000;
          mpc.ls=ls
          mpc.theta=mpc.tableAngle-Math.PI/2;
          mpcCompute.setupTs(mpc)
          mpcCompute.Bsfromls(mpc)

          
          tipOpeningSlider.min=data.minTip;
          tipOpeningSlider.max=data.maxTip;
          facingLengthSlider.max=maxFacing;
          
          syncValue(tipOpeningIn,tipOpeningControls);
          syncValue(25,facingLengthControls);


          setupBaffleControls(mpc);
          setupDragging(mpc);
          mpcDraw.drawContour(mpc,canvas);
          boreTypeChange('round');
      })
}


tipOpeningSlider.addEventListener('input', ()=>{
  let newTipIn = parseInt(tipOpeningSlider.value,10);
  syncValue(newTipIn,tipOpeningControls);
  mpc.tipOpening=newTipIn*25.4/1000;
  mpcDraw.drawContour(mpc,canvas);

})

facingLengthSlider.addEventListener('input', ()=>{
  let newFacingLength = parseInt(facingLengthSlider.value, 10);
  syncValue(newFacingLength,facingLengthControls)
  mpc.facingLength=newFacingLength;
  mpcDraw.drawContour(mpc,canvas)
  
})
tipOpeningNumber.addEventListener('input', (e) => {
  let newTipIn = parseInt(e.target.value, 10);
  if (newTipIn >= tipOpeningSlider.min && newTipIn <= tipOpeningSlider.max ){
  syncValue(newTipIn,tipOpeningControls)
  mpc.tipOpening=newTipIn*25.4/1000;
  mpcDraw.drawContour(mpc)
  };
});

facingLengthNumber.addEventListener('input', (e) => {
  let newFacingLength = parseInt(e.target.value, 10);
  if (newFacingLength >= facingLengthSlider.min && newFacingLength <=facingLengthSlider.max ){
  
  syncValue(newFacingLength,facingLengthControls)
  mpc.facingLength=newFacingLength;
  mpcDraw.drawContour(mpc,canvas)
  };
});




const templateFile = {
  S:'templates/soprano.json',
  A:'templates/alto.json',
  T:'templates/tenor.json',
  B:'templates/baritone.json'
}
function toggleControlPoint(index, enabled,mpc) {
  mpc.Bs[index].enabled = enabled;
  mpcDraw.drawContour(mpc,canvas);
}
function updateLsValue(index, l,mpc) {
  mpc.ls[index]=l;
  mpcCompute.Bsfromls(mpc);
  mpcDraw.drawContour(mpc,canvas);
}
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
          const newValue = parseFloat(e.target.value, 10);
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
function setupDragging(mpc) {
  let draggingPoint = null;

  canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const rawMouseX = e.clientX - rect.left;
      const rawMouseY = e.clientY - rect.top;
      const mouse=mpcCompute.deTransformMouseCoord(rawMouseX,rawMouseY,canvas);
      draggingPoint = mpc.Bs.find(
          point => point.enabled &&
              Math.hypot(point.x - mouse.x, point.y - mouse.y) < factor/10
      );
  });

  canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const rawMouseX = e.clientX - rect.left;
      const rawMouseY = e.clientY - rect.top;
      const mouse=mpcCompute.deTransformMouseCoord(rawMouseX,rawMouseY,canvas);
      if (draggingPoint) {
          let ptIndex=mpc.Bs.indexOf(draggingPoint);
          let nearestPt=mpcCompute.closestPointOnLine(mouse.x,mouse.y,mpc,ptIndex);
          //draggingPoint.x = nearestPt.x;
          //draggingPoint.y = nearestPt.y;
          let l=mpcCompute.computeLValue(nearestPt,ptIndex,mpc);
          mpc.ls[ptIndex]=Math.round(l*20)/20;
          let theta=mpc.tableAngle-Math.PI/2;
          let tPoint=mpc.Ts[ptIndex];
          let bx=tPoint.x - l * Math.cos(theta);
          let by=tPoint.y - l * Math.sin(theta);
          draggingPoint.x=bx;
          draggingPoint.y=by;
          document.getElementById(`input${ptIndex}`).value = mpc.ls[ptIndex];
          mpcDraw.drawContour(mpc,canvas);
      }
  });

  canvas.addEventListener("mouseup", () => {
      draggingPoint = null;
  });
}


boreSelector.forEach((radio) => {
  radio.addEventListener('change', (event) => {
      let boreType = event.target.value;
      // Call your existing functions here based on the selected value
      boreTypeChange(boreType);
  });
});
function updateBore(mpc) {
  bctx.clearRect(-boreCanvas.width, -boreCanvas.height, 2*boreCanvas.width, 2*boreCanvas.height);
  let effInnerRad=12;
  let effOuterRad=15;
  bctx.beginPath();
  bctx.arc(0,0,effInnerRad,0,2*Math.PI,false);
  bctx.moveTo(effOuterRad,0)
  bctx.arc(0,0,effOuterRad,0,2*Math.PI,true);
  bctx.stroke();  
  bctx.fillStyle = "rgb(0 0 0 / 20%)";
  bctx.fill();

  switch(mpc.boreType) {
    case 'round':
      bctx.beginPath();
      bctx.arc(0,0,mpc.circBoreRatio*effInnerRad,0,2*Math.PI);
      bctx.stroke();
      mpc.topBoreDis=mpc.innerRadius*mpc.circBoreRatio;
      mpc.bottomBoreDis=-mpc.innerRadius*mpc.circBoreRatio;
      break;
  }
  mpcDraw.drawContour(mpc,canvas)
}
function boreTypeChange(boreType){
  const controlDiv = document.createElement("div");
  controlDiv.className = "boreControl";
  boreControlsDiv.innerHTML = "";
  mpc.boreType=boreType;
  switch(boreType) {
    case 'round':
      const label=document.createElement('lebel');
      label.textContent = 'Radius';
      label.htmlFor = 'Radius'

      const slider=document.createElement('input')
      slider.type='range';
      slider.id='circBoreRadSlider';
      slider.min='0.85';
      slider.max='1.1';
      slider.step='0.01';
      slider.value='1'

      const input = document.createElement("input");
      input.type = "number";
      input.value = '1';
      input.id='circBoreRadBox';

      let boreInputs=[slider,input];
      slider.addEventListener("input", () => {
        const newBoreValue = parseFloat(slider.value, 10);
        syncValue(newBoreValue,boreInputs);
        mpc.circBoreRatio=newBoreValue;
        updateBore(mpc)
  });
      input.addEventListener("input", () => {
        const newBoreValue = parseFloat(input.value, 10);
        if (newBoreValue <=slider.max && newBoreValue >=slider.min){
        syncValue(newBoreValue,boreInputs);
        mpc.circBoreRatio=newBoreValue;
        updateBore(mpc)}
  });
      controlDiv.appendChild(label);
      controlDiv.appendChild(slider);
      controlDiv.appendChild(input);
      boreControlsDiv.appendChild(controlDiv);
      mpc.circBoreRatio=1;
      updateBore(mpc)
      break;
    case 'slot':
      console.log('slot');
      break;
    case 'horseshoe':
      console.log('horseshoe')
  
  }
}

typeChange('S')
