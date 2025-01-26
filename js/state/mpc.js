import * as mpcCompute from './../utils/compute.js'; 

export default class mpcState {
    constructor() {
        // Core object properties
        this.state = {
            // Mouthpiece type and basic parameters
            type: 'S',  // S, A, T, B for different saxophone types
            
            // Essential measurements
            facingLength: 25,  // Length of the facing curve in mm
            tableAngle: Math.PI/2,  // Angle of the table in radians
            
            // Bore configuration
            boreType: 'round',  // round, slot, horseshoe
            circBoreRatio: 1,  // Ratio for bore scaling
                        
            // Computed properties
            shankCutoff: 0,  // Where the shank is cut off
            theta: 0,  // Computed angle for baffle calculations
            
            // UI-related state
            enabledPoints: [],  // Which baffle points are enabled
            selectedPoint: null // Currently selected point for dragging
        };


        // For managing change notifications
        this.listeners = new Set();
        
        // For handling asynchronous updates
        this.updateInProgress = false;
        
        // Initialize state
        this.update(this.state);
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.add(listener);
        // Return unsubscribe function for cleanup
        return () => this.listeners.delete(listener);
    }

    // Main update method
    async update(changes) {
        // Prevent concurrent updates
        if (this.updateInProgress) {
            return;
        }
        
        this.updateInProgress = true;
        
        try {
            // Handle template loading if type changes
            if (changes.type && changes.type !== this.state.type) {
                await this.loadTemplate(changes.type);
            }
            
            // Apply direct changes
            Object.assign(this.state, changes);
            // Update dependent values
            await this.recalculateDependencies(changes);
            
            // Notify listeners
            this.notify();
        } finally {
            this.updateInProgress = false;
        }
    }

    // Handle all dependent calculations
    recalculateDependencies(changes) {
        // Track which properties have been recalculated
        const recalculated = new Set();
        
        if (changes.ls) {    
            this.state.Bs = mpcCompute.Bsfromls(this.state);
            recalculated.add('Bs');
        }
        if (changes.Bs) {
            this.state.ls = mpcCompute.lsFromBs(this.state);
            recalculated.add('ls');
        }
    }

    // Load template data for a mouthpiece type
    async loadTemplate(type) {
        try {
            const response = await fetch(`/assets/templates/${type}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load template for type ${type}`);
            }
            
            const template = await response.json();
            
            // Apply template values and compute initial state
            this.applyTemplate(template);
            
        } catch (error) {
            console.error('Error loading template:', error);
            throw error;
        }
    }

    // Apply template data and initialize derived values
    applyTemplate(template) {
        Object.assign(this.state, template);
        
        // Initialize derived values
        this.state.shankCutoff = this.state.totalLength - 
                                this.state.borePosition - 10;
        this.state.theta = this.state.tableAngle - Math.PI/2;;
        this.state.tipOpening=template.defaultTip*25.4/1000;
        this.state.facingLength=25;
        this.state.topBoreDis=template.innerRadius;
        this.state.bottomBoreDis=-template.innerRadius;
        this.state.ls=template.defaultLs;
        this.state.Ts = mpcCompute.initializeTs(this.state);
        this.state.Bs = mpcCompute.Bsfromls(this.state);

    }


    // Notify all listeners of state changes
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}