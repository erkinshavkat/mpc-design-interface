import * as mpcCompute from './utils/compute.js';
import * as mpcDraw from './utils/draw.js'; 
import mpcState from './state/mpc.js';
import controlsManager from './ui/sliderinput.js';

const canvas = document.getElementById('bsplineCanvas');
const ctx = canvas.getContext('2d');


let factor=15;
ctx.setTransform(factor, 0, 0, factor, 0, 0);
ctx.translate((canvas.height/2)/factor,(canvas.height/2)/factor);
ctx.lineWidth=2/factor;
ctx.rotate(3*Math.PI/2);

let mpc= new mpcState();
let controls=new controlsManager(mpc,canvas);

//mpcDraw.drawContour(mpc.state,canvas);
mpc.subscribe(state => mpcDraw.drawContour(state,canvas));



const typeSelector=document.querySelectorAll('input[name="type"]');
typeSelector.forEach((radio) => {
    radio.addEventListener('change', async (event) => {
        let mpcType = event.target.value;
  
        // Call your existing functions here based on the selected value
        await mpc.update({type:mpcType});
        controls.initializeControls(mpc.state);
    });
  });
