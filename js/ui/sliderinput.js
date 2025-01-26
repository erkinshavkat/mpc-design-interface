import * as mpcCompute from './../utils/compute.js'; 

// Try: createLinkedSliderNumber only allows for updating min and max
export default class controlsManager {
    constructor(mpc, canvas) {
        this.mpc = mpc;
        this.canvas = canvas;
        this.controls = new Map();
        this.state=mpc.state
    }
    createLinkedSliderNumber(options) {
        const {
            id,
            label,
            min,
            max,
            step,
            defaultValue,
            extraActions,
            parent,
            enableToggle
    }=options;


    let container;
    if (!parent) {
        container = document.createElement('div');
    } else {
        container = parent;
    };
    //create label if provided
    if (label) {
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.htmlFor = `${id}Slider`;
        container.appendChild(labelElement);
    }

    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `${id}Slider`;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = defaultValue;

    // Create input
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `${id}Input`;
    input.value = defaultValue;
    input.step = step;


    // Add extra actions
    if (extraActions) {
        extraActions.sliderActions.forEach(action => {
            action(slider);
        });
        extraActions.inputActions.forEach(action => {
            action(input);
        });
    };

    // Sync between slider and input
    slider.addEventListener('input', e => syncValue(e.target.value));
    input.addEventListener('blur', e => syncValue(e.target.value));

    container.appendChild(slider);
    container.appendChild(input);

    let toggle;
    if (enableToggle) {
        toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.id = `${id}Toggle`;
        toggle.checked = true;
        container.appendChild(toggle);
        toggle.addEventListener('change', e => {
            const toggled= e.target.checked;
            slider.disabled=!toggled;
            input.disabled=!toggled;
        });
    }

    const syncValue = (value) => {
        value = mpcCompute.clipMinMax(value, min, max);
        value = Math.round(value / step) * step;
        slider.value = value;
        input.value = value;
    };

    this.controls.set(id, { container, slider, input,toggle, syncValue });
    return { container, 
        slider, 
        input,
        toggle,
        syncValue
    };
}
    
    initializeControls(newState) {
        this.state = newState;

        let tipOpeningArea = document.getElementById("tipOpeningArea");
        let facingLengthArea = document.getElementById("facingLengthArea");
        tipOpeningArea.innerHTML='';
        facingLengthArea.innerHTML='';

        const tipOpeningControls = this.createLinkedSliderNumber({
            id: 'tipOpening',
            label: 'Tip Opening',
            min: this.state.minTip,
            max: this.state.maxTip,
            step: 1,
            defaultValue: this.state.defaultTip,
            parent: tipOpeningArea
          });
        tipOpeningControls.slider.addEventListener('input', (e) => {
            this.mpc.update({tipOpening:e.target.value*25.4/1000});
        });
        tipOpeningControls.input.addEventListener('blur', (e) => {
            this.mpc.update({tipOpening:e.target.value*25.4/1000});
        });



        const facingLengthControls = this.createLinkedSliderNumber({
            id: 'facingLength',
            label: 'Facing Length',
            min: 15,
            max: mpcCompute.computeMaxFacing(this.state),
            step: 0.5,
            defaultValue: 25,
            parent: facingLengthArea
          });
        facingLengthControls.slider.addEventListener('input', (e) => {
            this.mpc.update({facingLength:e.target.value});
        });
        facingLengthControls.input.addEventListener('blur', (e) => {
            this.mpc.update({facingLength:e.target.value});
        });

        const splineControls = document.getElementById('splineControls');
        splineControls.innerHTML='';
        this.state.ls.forEach((lvalue, index) => {
            const bafflePtControls = this.createLinkedSliderNumber({
                id: `baffleInput${index}`,
                min: 0,
                max: mpcCompute.computeMaxl(index,this.state),
                step: 0.05,
                defaultValue: lvalue,
                enableToggle: true
            });
            bafflePtControls.slider.addEventListener('input', (e) => {
                const newlarray=[...this.state.ls.slice(0,index),e.target.value,...this.state.ls.slice(index+1)];
                this.mpc.update({ls:newlarray});
            });
            bafflePtControls.input.addEventListener('blur', (e) => {
                const newlarray=[...this.state.ls.slice(0,index),e.target.value,...this.state.ls.slice(index+1)];
                this.mpc.update({ls:newlarray});
            });
            bafflePtControls.toggle.addEventListener('change', (e) => {
                //console.log(this.state)
                let newBs=this.state.Bs;
                newBs[index].enabled=e.target.checked;
                this.mpc.update({Bs:newBs});
            });


            splineControls.appendChild(bafflePtControls.container);

        });
    }
}