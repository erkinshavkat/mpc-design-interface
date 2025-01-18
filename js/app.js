import * as mpcCompute from './utils/compute.js';

import * as mpcDraw from './utils/draw.js'; 

// Initial control points (with default y values)
let mpc={};
// B-spline settings

const canvas = document.getElementById('bsplineCanvas');
const ctx = canvas.getContext('2d');


const boreCanvas = document.getElementById('chamberCanvas');
const bctx = boreCanvas.getContext('2d');
let factor=15;
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
          mpc.mpcType=mpcType;
          let factor=scaleFactors[mpcType];
          let shankCutoff=(data.totalLength-data.borePosition-10);
          mpc.shankCutoff=shankCutoff;
          ctx.resetTransform();
          ctx.scale(factor,factor);
          ctx.translate(-shankCutoff,(canvas.height/2)/factor);
          ctx.lineWidth=2/factor;


          ctx.rotate(3*Math.PI/2);
          
          let tipOpeningIn = data.defaultTip;
          mpc.facingLength = 25;
          mpc.topBoreDis=data.innerRadius;
          mpc.bottomBoreDis=-data.innerRadius;
          let ls=data.defaultLs;
          let maxFacing=Math.round(data.totalLength-(mpcCompute.windowVertex(data).y-data.windowLength-data.windowBottomWidth/2));
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
tipOpeningNumber.addEventListener('blur', (e) => {
  let newTipIn = parseInt(e.target.value, 10);
  newTipIn=mpcCompute.clipMinMax(newTipIn,tipOpeningSlider.min,tipOpeningSlider.max);
  syncValue(newTipIn,tipOpeningControls);
  mpc.tipOpening=newTipIn*25.4/1000;
  mpcDraw.drawContour(mpc,canvas)
});

facingLengthNumber.addEventListener('blur', (e) => {
  let newFacingLength = parseInt(e.target.value, 10);
  newFacingLength=mpcCompute.clipMinMax(newFacingLength,facingLengthSlider.min,facingLengthSlider.max);
  syncValue(newFacingLength,facingLengthControls);
  mpc.facingLength=newFacingLength;
  mpcDraw.drawContour(mpc,canvas)
});

const scaleFactors = {
  S:18,
  A:15,
  T:15,
  B:15
}


const templateFile = {
  S:'../assets/templates/soprano.json',
  A:'../assets/templates/alto.json',
  T:'../assets/templates/tenor.json',
  B:'../assets/templates/baritone.json'
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
const rect = canvas.getBoundingClientRect();

function setupBaffleControls(mpc) {

  mpc.Bs.forEach((point, index) => {
    const rect = canvas.getBoundingClientRect();

      let controlsX=rect.left + scaleFactors[mpc.mpcType] * (mpc.Ts[index].y - mpc.shankCutoff);
      let controlsY=rect.top;
      let maxl=mpcCompute.computeMaxl(index,mpc);
      const controlDiv = document.createElement("div");
      controlDiv.className = `control-point${index}`;
      const label = document.createElement("label");
      label.textContent = `Point ${index + 1}: `;
      label.htmlFor = `input${index}`;

      const input = document.createElement("input");
      input.type = "number";
      input.value = mpc.ls[index];
      input.id = `baffleInput${index}`;
      input.step='0.05';
      input.style="position: absolute;"
      input.style.width='40px';
      input.addEventListener("blur", (e) => {
        if (mpc.Bs[index].enabled) {
          const newValue = parseFloat(e.target.value, 10);
          let clippedValue=mpcCompute.clipMinMax(newValue,0,maxl)
          let l=Math.round(clippedValue*20)/20
          syncValue(l,[slider,input]);
          updateLsValue(index, l,mpc);}
      });

      const slider = document.createElement("input");
      slider.type = "range";
      slider.value = mpc.ls[index];
      slider.id = `baffleSlider${index}`;
      slider.step='0.05';
      slider.min = `0`;
      slider.max= `${maxl}`;
      slider.classList.add('vertical-slider');
      slider.style="position: absolute;"
      slider.addEventListener("input", () => {
        if (mpc.Bs[index].enabled) {

          const newValue = parseFloat(slider.value, 10);
          let clippedValue=mpcCompute.clipMinMax(newValue,0,maxl)
          let l=Math.round(clippedValue*20)/20
          syncValue(l,[slider,input]);
          updateLsValue(index, l,mpc);}
      });

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = point.enabled;
      checkbox.id = `baffleCheckbox${index}`;

      checkbox.style="position: absolute;"

      checkbox.addEventListener("change", (e) => {
          const toggled= e.target.checked;
          slider.disabled=!toggled;
          input.disabled=!toggled;
          toggleControlPoint(index, toggled,mpc);
      });

      // const checkboxLabel = document.createElement("label");
      // checkboxLabel.textContent = " Enable";
      // checkboxLabel.htmlFor = `checkbox${index}`;

      //controlDiv.appendChild(label);
      controlDiv.appendChild(input);
      controlDiv.appendChild(slider);
      controlDiv.appendChild(checkbox);
      // controlDiv.appendChild(checkboxLabel);

      splineControlsDiv.appendChild(controlDiv);

      checkbox.style.left= `${controlsX-checkbox.offsetWidth/2}px`;
      checkbox.style.top= `${controlsY-checkbox.offsetHeight/2}px`;


      slider.style.left= `${controlsX-slider.offsetWidth/2}px`;
      slider.style.top= `${controlsY-slider.offsetWidth*0.65}px`;


      input.style.left= `${controlsX-input.offsetWidth/2}px`;
      input.style.top= `${slider.offsetTop-slider.offsetWidth*0.65}px`;


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
          let l=Math.round(mpcCompute.computeLValue(nearestPt,ptIndex,mpc)*20)/20;
          mpc.ls[ptIndex]=l;
          let theta=mpc.tableAngle-Math.PI/2;
          let tPoint=mpc.Ts[ptIndex];
          let bx=tPoint.x - l * Math.cos(theta);
          let by=tPoint.y - l * Math.sin(theta);
          draggingPoint.x=bx;
          draggingPoint.y=by;
          syncValue(l, [document.getElementById(`baffleInput${ptIndex}`),document.getElementById(`baffleSlider${ptIndex}`)])
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
      input.step='0.01';
      input.id='circBoreRadBox';
      input.style.width='40px';
      let boreInputs=[slider,input];
      slider.addEventListener("input", () => {
        const newBoreValue = parseFloat(slider.value, 10);
        syncValue(newBoreValue,boreInputs);
        mpc.circBoreRatio=newBoreValue;
        mpcDraw.drawBore(mpc,boreCanvas);
        mpcDraw.drawContour(mpc,canvas);
  });
      input.addEventListener("blur", () => {
        let newBoreValue = parseFloat(input.value, 10);
        newBoreValue=mpcCompute.clipMinMax(newBoreValue,slider.min,slider.max)
        syncValue(newBoreValue,boreInputs);
        mpc.circBoreRatio=newBoreValue;
        mpcDraw.drawBore(mpc,boreCanvas,canvas);
        mpcDraw.drawContour(mpc,canvas);

  });
      controlDiv.appendChild(label);
      controlDiv.appendChild(slider);
      controlDiv.appendChild(input);
      boreControlsDiv.appendChild(controlDiv);
      mpc.circBoreRatio=1;
      mpcDraw.drawBore(mpc,boreCanvas,canvas);
      mpcDraw.drawContour(mpc,canvas);

      break;
    case 'slot':
      console.log('slot');
      break;
    case 'horseshoe':
      console.log('horseshoe')
  
  }
}

typeChange('S')
