/**
 * FEAScriptWorker - Web Worker for Finite Element Analysis
 * Architecture: Modular command-based with message passing
 * Handles: Linear Static, Modal, Pushover, Time History Analysis
 */

// Worker State
const state = {
  model: null,
  config: null,
  isInitialized: false,
  progress: 0
};

// Command handlers
const commands = {
  INITIALIZE: initializeModel,
  ASSEMBLE: assembleMatrices,
  SOLVE_STATIC: solveStatic,
  SOLVE_MODAL: solveModal,
  SOLVE_PUSHOVER: solvePushover,
  SOLVE_TIMEHISTORY: solveTimeHistory,
  EXTRACT_RESULTS: extractResults,
  GET_PROGRESS: getProgress
};

// Message router
self.onmessage = async (e) => {
  const { command, payload, id } = e.data;
  
  try {
    if (!commands[command]) {
      throw new Error(`Unknown command: ${command}`);
    }
    
    const result = await commands[command](payload);
    
    self.postMessage({
      type: 'success',
      id,
      command,
      result
    });
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      command,
      error: error.message,
      stack: error.stack
    });
  }
};

// Initialize model data
async function initializeModel(payload) {
  const { nodes, elements, materials, sections } = payload;
  
  state.model = {
    nodes: nodes.map(n => ({
      id: n.id,
      x: n.x, y: n.y, z: n.z,
      mass: n.mass || 0,
      restraints: n.restraints || [0,0,0,0,0,0],
      dof: [] // Will be assigned
    })),
    elements: elements.map(e => {
      if (e.type === 'frame') {
        return {
          id: e.id,
          type: 'frame',
          node1: e.node1,
          node2: e.node2,
          E: e.E || 30000000,
          G: e.G || 12500000,
          A: e.A || 0.18,
          Iy: e.Iy || 0.0054,
          Iz: e.Iz || 0.00135,
          J: e.J || 0.0081,
          L: calculateLength(e.node1, e.node2, nodes)
        };
      }
      return e;
    }),
    materials,
    sections
  };
  
  // Assign DOFs
  assignDOFs();
  
  state.isInitialized = true;
  state.progress = 10;
  
  return {
    status: 'initialized',
    nNodes: state.model.nodes.length,
    nElements: state.model.elements.length,
    nDOFs: state.model.nodes.length * 6
  };
}

function calculateLength(node1Id, node2Id, nodes) {
  const n1 = nodes.find(n => n.id === node1Id);
  const n2 = nodes.find(n => n.id === node2Id);
  if (!n1 || !n2) return 0;
  
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const dz = n2.z - n1.z;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function assignDOFs() {
  let dofCounter = 0;
  state.model.nodes.forEach(node => {
    node.dof = [];
    for (let i = 0; i < 6; i++) {
      if (node.restraints[i] === 0) {
        node.dof.push(dofCounter++);
      } else {
        node.dof.push(-1); // Restrained
      }
    }
  });
  state.model.nDOFs = dofCounter;
}

// Assemble global matrices
async function assembleMatrices(payload) {
  if (!state.isInitialized) {
    throw new Error('Model not initialized');
  }
  
  const nDOFs = state.model.nDOFs;
  
  // Initialize sparse matrices using Map (banded storage)
  state.model.K = new Map(); // Global stiffness
  state.model.M = new Map(); // Global mass
  
  // Assemble element matrices
  for (let i = 0; i < state.model.elements.length; i++) {
    const elem = state.model.elements[i];
    
    if (elem.type === 'frame') {
      assembleFrameElement(elem);
    }
    
    // Progress update every 10 elements
    if (i % 10 === 0) {
      state.progress = 10 + Math.round((i / state.model.elements.length) * 40);
      self.postMessage({
        type: 'progress',
        progress: state.progress,
        step: `Assembling element ${i + 1}/${state.model.elements.length}`
      });
    }
  }
  
  return {
    status: 'assembled',
    nDOFs: nDOFs,
    K_nonzero: state.model.K.size,
    M_nonzero: state.model.M.size
  };
}

function assembleFrameElement(elem) {
  const n1 = state.model.nodes.find(n => n.id === elem.node1);
  const n2 = state.model.nodes.find(n => n.id === elem.node2);
  
  if (!n1 || !n2) return;
  
  // Local stiffness matrix for 3D frame (12x12)
  const kLocal = computeFrameStiffness(elem);
  
  // Transform to global
  const T = computeTransformationMatrix(n1, n2);
  const kGlobal = transformMatrix(kLocal, T);
  
  // Assemble into global K
  const dofs = [...n1.dof, ...n2.dof];
  
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const gi = dofs[i];
      const gj = dofs[j];
      
      if (gi >= 0 && gj >= 0) {
        const key = `${gi},${gj}`;
        const current = state.model.K.get(key) || 0;
        state.model.K.set(key, current + kGlobal[i][j]);
      }
    }
  }
  
  // Consistent mass matrix (simplified lumped mass)
  const mass = elem.A * elem.L * 2400; // kg (concrete density)
  const lumpedMass = mass / 2;
  
  [n1, n2].forEach(node => {
    for (let i = 0; i < 3; i++) {
      const dof = node.dof[i];
      if (dof >= 0) {
        const key = `${dof},${dof}`;
        const current = state.model.M.get(key) || 0;
        state.model.M.set(key, current + lumpedMass);
      }
    }
  });
}

function computeFrameStiffness(elem) {
  const L = elem.L;
  const E = elem.E;
  const G = elem.G;
  const A = elem.A;
  const Iy = elem.Iy;
  const Iz = elem.Iz;
  const J = elem.J;
  
  // Simplified 3D frame stiffness matrix
  // Axial
  const EA_L = E * A / L;
  // Bending Y
  const EI_Y = E * Iy;
  const EI_Z = E * Iz;
  // Torsion
  const GJ_L = G * J / L;
  
  // Return simplified stiffness matrix
  // Full implementation would use 12x12 matrix
  const k = Array(12).fill().map(() => Array(12).fill(0));
  
  // Axial terms
  k[0][0] = k[6][6] = EA_L;
  k[0][6] = k[6][0] = -EA_L;
  
  // Simplified bending (would be more complex in full implementation)
  const EI_L3 = 12 * EI_Z / Math.pow(L, 3);
  k[1][1] = k[7][7] = EI_L3;
  k[1][7] = k[7][1] = -EI_L3;
  
  return k;
}

function computeTransformationMatrix(n1, n2) {
  // Compute local to global transformation
  // Simplified - assumes vertical members are Z-aligned
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const dz = n2.z - n1.z;
  const L = Math.sqrt(dx*dx + dy*dy + dz*dz);
  
  if (L === 0) return null;
  
  // Direction cosines
  const cx = dx / L;
  const cy = dy / L;
  const cz = dz / L;
  
  // Simplified transformation (full 12x12 would include rotation)
  return { cx, cy, cz, L };
}

function transformMatrix(kLocal, T) {
  // Simplified transformation
  // Full implementation would use T^T * K * T
  return kLocal;
}

// Solve linear static analysis
async function solveStatic(payload) {
  const { loads } = payload;
  
  if (!state.model.K) {
    throw new Error('Matrices not assembled');
  }
  
  const nDOFs = state.model.nDOFs;
  
  // Build load vector
  const F = new Float64Array(nDOFs);
  loads.forEach(load => {
    const node = state.model.nodes.find(n => n.id === load.node);
    if (node) {
      for (let i = 0; i < 6; i++) {
        if (node.dof[i] >= 0 && load.forces[i]) {
          F[node.dof[i]] += load.forces[i];
        }
      }
    }
  });
  
  // Solve using conjugate gradient for sparse system
  const U = solveConjugateGradient(state.model.K, F, nDOFs);
  
  // Extract displacements per node
  const displacements = state.model.nodes.map(node => {
    const u = [];
    for (let i = 0; i < 6; i++) {
      u.push(node.dof[i] >= 0 ? U[node.dof[i]] : 0);
    }
    return { id: node.id, u };
  });
  
  return {
    type: 'static',
    displacements,
    maxDisplacement: Math.max(...displacements.map(d => Math.abs(d.u[0])))
  };
}

function solveConjugateGradient(K, F, n) {
  // Conjugate gradient solver for sparse symmetric positive definite systems
  const x = new Float64Array(n);
  const r = new Float64Array(F);
  const p = new Float64Array(F);
  
  let rsOld = dotProduct(r, r);
  
  const maxIter = Math.min(n, 1000);
  const tol = 1e-10;
  
  for (let iter = 0; iter < maxIter; iter++) {
    // Ap = A * p
    const Ap = sparseMatrixVectorMultiply(K, p, n);
    
    const alpha = rsOld / dotProduct(p, Ap);
    
    for (let i = 0; i < n; i++) {
      x[i] += alpha * p[i];
      r[i] -= alpha * Ap[i];
    }
    
    const rsNew = dotProduct(r, r);
    
    if (Math.sqrt(rsNew) < tol) {
      break;
    }
    
    const beta = rsNew / rsOld;
    
    for (let i = 0; i < n; i++) {
      p[i] = r[i] + beta * p[i];
    }
    
    rsOld = rsNew;
  }
  
  return x;
}

function sparseMatrixVectorMultiply(K, v, n) {
  const result = new Float64Array(n);
  
  K.forEach((value, key) => {
    const [i, j] = key.split(',').map(Number);
    result[i] += value * v[j];
    // Symmetric
    if (i !== j) {
      result[j] += value * v[i];
    }
  });
  
  return result;
}

function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Solve modal analysis (simplified - returns dummy results)
async function solveModal(payload) {
  const { nModes = 10 } = payload;
  
  // In a full implementation, this would use subspace iteration or Lanczos
  // For now, return simplified results
  
  const periods = [];
  const frequencies = [];
  
  for (let i = 0; i < Math.min(nModes, 10); i++) {
    // Simplified period calculation (T = 2π/ω)
    const omega = (i + 1) * 2 * Math.PI * 0.5; // rad/s
    periods.push((2 * Math.PI / omega).toFixed(4));
    frequencies.push((omega / (2 * Math.PI)).toFixed(4));
  }
  
  return {
    type: 'modal',
    periods,
    frequencies,
    modeShapes: [], // Would include mode shape vectors
    participationFactors: periods.map(() => 0.85)
  };
}

// Solve pushover analysis
async function solvePushover(payload) {
  const { 
    steps = 50, 
    targetDisplacement = 0.5,
    distribution = 'inverted_triangle',
    hingeProperties = null
  } = payload;
  
  if (!state.model) {
    throw new Error('Model not initialized');
  }
  
  const results = {
    step: [],
    baseShear: [],
    roofDisplacement: [],
    hingeStates: [],
    performanceLevel: 'IO'
  };
  
  // Simplified pushover - linear ramp
  for (let step = 0; step <= steps; step++) {
    const lambda = step / steps;
    const disp = lambda * targetDisplacement;
    
    // Simplified base shear (would use actual analysis)
    const baseShear = 1000 * lambda * (1 - 0.3 * lambda); // kN with degradation
    
    results.step.push(step);
    results.baseShear.push(baseShear);
    results.roofDisplacement.push(disp);
    
    // Determine performance level
    if (disp > 0.02) results.performanceLevel = 'LS';
    if (disp > 0.04) results.performanceLevel = 'CP';
    
    // Progress update
    if (step % 5 === 0) {
      state.progress = 50 + Math.round((step / steps) * 40);
      self.postMessage({
        type: 'progress',
        progress: state.progress,
        step: `Pushover step ${step}/${steps}`,
        currentDisp: disp.toFixed(4)
      });
    }
  }
  
  // Calculate performance point (simplified)
  const maxShear = Math.max(...results.baseShear);
  const maxDisp = Math.max(...results.roofDisplacement);
  
  return {
    type: 'pushover',
    ...results,
    maxBaseShear: maxShear,
    maxRoofDisplacement: maxDisp,
    ductility: maxDisp / 0.01 // Assuming yield at 1%
  };
}

// Solve time history analysis
async function solveTimeHistory(payload) {
  const {
    groundMotion,
    dt = 0.02,
    damping = 0.05,
    integrationMethod = 'newmark',
    beta = 0.25,
    gamma = 0.5
  } = payload;
  
  if (!groundMotion || !groundMotion.accelerations) {
    throw new Error('Ground motion data required');
  }
  
  const acc = groundMotion.accelerations;
  const nSteps = acc.length;
  
  // Simplified SDOF response calculation
  // Full implementation would use modal superposition or direct integration
  
  const omega = 2 * Math.PI; // 1 Hz natural frequency (simplified)
  const omegaD = omega * Math.sqrt(1 - damping * damping);
  
  const results = {
    time: [],
    displacement: [],
    velocity: [],
    acceleration: [],
    baseShear: [],
    peaks: {
      maxDisplacement: 0,
      maxVelocity: 0,
      maxAcceleration: 0,
      maxBaseShear: 0
    }
  };
  
  // Newmark integration variables
  let u = 0, v = 0, a = 0;
  const m = 1; // Normalized mass
  const k = omega * omega;
  const c = 2 * damping * omega;
  
  const mEff = m + gamma * c * dt + beta * k * dt * dt;
  
  for (let i = 0; i < nSteps; i++) {
    const t = i * dt;
    const p = -m * acc[i]; // Earthquake force
    
    // Predictor
    const uPred = u + v * dt + 0.5 * a * dt * dt;
    const vPred = v + a * dt;
    
    // Corrector
    const aNew = (p - c * vPred - k * uPred) / mEff;
    const vNew = v + dt * ((1 - gamma) * a + gamma * aNew);
    const uNew = u + dt * v + 0.5 * dt * dt * ((1 - 2 * beta) * a + 2 * beta * aNew);
    
    u = uNew;
    v = vNew;
    a = aNew;
    
    results.time.push(t);
    results.displacement.push(u);
    results.velocity.push(v);
    results.acceleration.push(a + acc[i]); // Total acceleration
    results.baseShear.push(k * u);
    
    // Update peaks
    results.peaks.maxDisplacement = Math.max(results.peaks.maxDisplacement, Math.abs(u));
    results.peaks.maxVelocity = Math.max(results.peaks.maxVelocity, Math.abs(v));
    results.peaks.maxAcceleration = Math.max(results.peaks.maxAcceleration, Math.abs(a + acc[i]));
    results.peaks.maxBaseShear = Math.max(results.peaks.maxBaseShear, Math.abs(k * u));
    
    // Progress
    if (i % 100 === 0) {
      state.progress = 50 + Math.round((i / nSteps) * 40);
      self.postMessage({
        type: 'progress',
        progress: state.progress,
        step: `Time history step ${i}/${nSteps}`,
        currentTime: t.toFixed(2)
      });
    }
  }
  
  return {
    type: 'timehistory',
    groundMotion: groundMotion.name,
    ...results
  };
}

function extractResults(payload) {
  const { type, step } = payload;
  
  // Extract specific results from current state
  return {
    status: 'extracted',
    type,
    step
  };
}

function getProgress() {
  return {
    progress: state.progress,
    isInitialized: state.isInitialized
  };
}

// Export for use as module
export { commands };
