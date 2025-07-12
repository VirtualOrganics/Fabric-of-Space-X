/**
 * Visualizer.js
 * 
 * Visualization module for applying acuteness analysis coloring to Three.js meshes.
 * This module handles the mapping of analysis scores to colors and applies them to geometry.
 */

// THREE.js objects will be injected from the main application
let THREE = null;
let ConvexGeometry = null;

/**
 * Initialize the visualizer with THREE.js objects
 * @param {Object} threeJS - The THREE.js object
 * @param {Object} convexGeometry - The ConvexGeometry class
 */
export function initVisualizer(threeJS, convexGeometry) {
    THREE = threeJS;
    ConvexGeometry = convexGeometry;
    console.log('Visualizer initialized with THREE.js objects');
}

/**
 * Check if the visualizer is properly initialized
 * @returns {boolean} True if initialized, false otherwise
 */
function isInitialized() {
    if (!THREE || !ConvexGeometry) {
        console.error('Visualizer not initialized. Call initVisualizer() first.');
        return false;
    }
    return true;
}

/**
 * Color mapping utility - converts a normalized value [0,1] to a color
 * Uses a blue-to-red gradient where blue = low acuteness, red = high acuteness
 * @param {number} value - Normalized value between 0 and 1
 * @returns {number} Color as hex integer
 */
function mapValueToColor(value) {
    // Clamp value to [0, 1]
    const normalizedValue = Math.max(0, Math.min(1, value));
    
    // Blue-to-red gradient
    // Blue (0x0000FF) at value 0, Red (0xFF0000) at value 1
    const red = Math.floor(255 * normalizedValue);
    const blue = Math.floor(255 * (1 - normalizedValue));
    const green = 0;
    
    return (red << 16) | (green << 8) | blue;
}

/**
 * Create a color legend for the acuteness analysis
 * @param {number} maxScore - Maximum score in the analysis
 * @param {string} analysisType - Type of analysis (CELL, FACE, VERTEX)
 * @returns {string} HTML string for the color legend
 */
function createColorLegend(maxScore, analysisType = '') {
    const steps = 5;
    let legendHTML = '<div id="acuteness-legend" style="position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px; font-size: 12px;">';
    
    // Add title based on analysis type
    const titles = {
        'CELL': 'Cell Acuteness',
        'FACE': 'Face Acuteness', 
        'VERTEX': 'Vertex Acuteness'
    };
    const title = titles[analysisType] || 'Acuteness Scale';
    legendHTML += `<div style="font-weight: bold; margin-bottom: 5px;">${title}</div>`;
    
    for (let i = 0; i <= steps; i++) {
        const value = i / steps;
        const color = mapValueToColor(value);
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        
        // Create percentage-based labels instead of raw scores
        const percentage = Math.round(value * 100);
        let label;
        
        if (i === 0) {
            label = 'Low (0%)';
        } else if (i === steps) {
            label = `High (100% - ${maxScore} max)`;
        } else {
            const scoreAtLevel = Math.round(value * maxScore);
            label = `${percentage}% (${scoreAtLevel})`;
        }
        
        legendHTML += `<div style="display: flex; align-items: center; margin: 2px 0;">`;
        legendHTML += `<div style="width: 20px; height: 15px; background: ${colorHex}; margin-right: 5px; border: 1px solid #ccc;"></div>`;
        legendHTML += `<span>${label}</span>`;
        legendHTML += `</div>`;
    }
    
    legendHTML += '</div>';
    return legendHTML;
}

/**
 * Apply analysis coloring to cell meshes
 * @param {Object} scene - Three.js scene object
 * @param {Object} voronoiFacesGroup - Three.js group containing Voronoi face meshes
 * @param {Array} analysisScores - Array of acuteness scores for each cell
 * @param {Object} computation - DelaunayComputation object
 */
export function applyCellColoring(scene, voronoiFacesGroup, analysisScores, computation) {
    console.log('Applying cell coloring for acuteness analysis...');
    
    if (!isInitialized()) return;
    
    if (!analysisScores || analysisScores.length === 0) {
        console.warn('No analysis scores provided for cell coloring');
        return;
    }
    
    // Calculate min and max scores for normalization
    const minScore = analysisScores.length > 0 ? Math.min(...analysisScores) : 0;
    const maxScore = analysisScores.length > 0 ? Math.max(...analysisScores) : 0;
    const range = maxScore - minScore;
    
    console.log(`Cell coloring range: ${minScore} to ${maxScore}`);
    
    // Get the cells mapping
    const cells = computation.getCells();
    
    // Clear existing meshes
    voronoiFacesGroup.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    });
    voronoiFacesGroup.clear();
    
    // Apply coloring to each cell
    let cellIndex = 0;
    for (const [vertexIndex, cellVertices] of cells.entries()) {
        if (cellIndex >= analysisScores.length) break;
        
        const score = analysisScores[cellIndex];
        const normalizedScore = range === 0 ? 0 : (score - minScore) / range;
        const color = mapValueToColor(normalizedScore);
        
        // Create material with the computed color
        const material = new THREE.MeshPhongMaterial({
            color: color,
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            alphaTest: 0.1
        });
        
        // Create convex geometry for the cell
        if (cellVertices.length >= 4) {
            try {
                const threeVertices = cellVertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
                const geometry = new ConvexGeometry(threeVertices);
                const mesh = new THREE.Mesh(geometry, material);
                voronoiFacesGroup.add(mesh);
            } catch (error) {
                console.warn(`Failed to create cell mesh for vertex ${vertexIndex}:`, error);
            }
        }
        
        cellIndex++;
    }
    
    // Add color legend to the DOM
    const existingLegend = document.getElementById('acuteness-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    const legendHTML = createColorLegend(maxScore, 'CELL');
    document.body.insertAdjacentHTML('beforeend', legendHTML);
    
    console.log(`Applied cell coloring to ${cellIndex} cells`);
}

/**
 * Apply analysis coloring to face meshes
 * @param {Object} scene - Three.js scene object
 * @param {Object} voronoiFacesGroup - Three.js group containing Voronoi face meshes
 * @param {Array} analysisScores - Array of acuteness scores for each face
 * @param {Object} computation - DelaunayComputation object
 */
export function applyFaceColoring(scene, voronoiFacesGroup, analysisScores, computation) {
    console.log('Applying face coloring for acuteness analysis...');
    
    if (!isInitialized()) return;
    
    if (!analysisScores || analysisScores.length === 0) {
        console.warn('No analysis scores provided for face coloring');
        return;
    }
    
    // Calculate min and max scores for normalization
    const minScore = analysisScores.length > 0 ? Math.min(...analysisScores) : 0;
    const maxScore = analysisScores.length > 0 ? Math.max(...analysisScores) : 0;
    const range = maxScore - minScore;
    
    console.log(`Face coloring range: ${minScore} to ${maxScore}`);
    
    // Get the faces
    const faces = computation.getFaces();
    
    // Clear existing meshes
    voronoiFacesGroup.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    });
    voronoiFacesGroup.clear();
    
    // Apply coloring to each face
    for (let i = 0; i < Math.min(faces.length, analysisScores.length); i++) {
        const face = faces[i];
        const score = analysisScores[i];
        const normalizedScore = range === 0 ? 0 : (score - minScore) / range;
        const color = mapValueToColor(normalizedScore);
        
        // Create material with the computed color
        const material = new THREE.MeshPhongMaterial({
            color: color,
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            alphaTest: 0.1
        });
        
        // Create geometry for the face
        if (face.voronoiVertices.length >= 3) {
            try {
                const threeVertices = face.voronoiVertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
                const geometry = new ConvexGeometry(threeVertices);
                const mesh = new THREE.Mesh(geometry, material);
                voronoiFacesGroup.add(mesh);
            } catch (error) {
                console.warn(`Failed to create face mesh for face ${i}:`, error);
            }
        }
    }
    
    // Add color legend to the DOM
    const existingLegend = document.getElementById('acuteness-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    const legendHTML = createColorLegend(maxScore, 'FACE');
    document.body.insertAdjacentHTML('beforeend', legendHTML);
    
    console.log(`Applied face coloring to ${faces.length} faces`);
}

/**
 * Apply analysis coloring to Voronoi vertices (dots representing tetrahedra barycenters)
 * @param {Object} scene - Three.js scene object
 * @param {Object} voronoiGroup - Three.js group containing Voronoi elements
 * @param {Array} analysisScores - Array of acuteness scores for each tetrahedron
 * @param {Object} computation - DelaunayComputation object
 */
export function applyVertexColoring(scene, voronoiGroup, analysisScores, computation) {
    console.log('Applying vertex coloring to Voronoi vertices (dots)...');
    
    if (!isInitialized()) return;
    
    if (!analysisScores || analysisScores.length === 0) {
        console.warn('No analysis scores provided for vertex coloring');
        return;
    }
    
    // Calculate min and max scores for normalization
    const minScore = analysisScores.length > 0 ? Math.min(...analysisScores) : 0;
    const maxScore = analysisScores.length > 0 ? Math.max(...analysisScores) : 0;
    const range = maxScore - minScore;
    
    console.log(`Vertex coloring range: ${minScore} to ${maxScore}`);
    
    // Get the Voronoi vertices (barycenters)
    const voronoiVertices = computation.getVertices();
    
    // Clear existing Voronoi vertex meshes (spheres)
    voronoiGroup.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'SphereGeometry') {
            child.geometry.dispose();
            child.material.dispose();
            voronoiGroup.remove(child);
        }
    });
    
    // Create colored spheres for each Voronoi vertex
    const sphereRadius = 0.01; // Make spheres visible
    
    for (let i = 0; i < Math.min(voronoiVertices.length, analysisScores.length); i++) {
        const vertex = voronoiVertices[i];
        const score = analysisScores[i];
        const normalizedScore = range === 0 ? 0 : (score - minScore) / range;
        const color = mapValueToColor(normalizedScore);
        
        // Create sphere geometry
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
        
        // Create material with the computed color
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        
        // Create mesh and position it
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(vertex[0], vertex[1], vertex[2]);
        voronoiGroup.add(sphere);
    }
    
    // Add color legend to the DOM
    const existingLegend = document.getElementById('acuteness-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    const legendHTML = createColorLegend(maxScore, 'VERTEX');
    document.body.insertAdjacentHTML('beforeend', legendHTML);
    
    console.log(`Applied vertex coloring to ${voronoiVertices.length} Voronoi vertices`);
}

/**
 * Main function to apply analysis coloring based on mode
 * @param {Object} scene - Three.js scene object
 * @param {Object} meshGroups - Object containing mesh groups (tetrahedraGroup, voronoiFacesGroup)
 * @param {Object} analysisResults - Object containing all analysis results
 * @param {string} coloringMode - 'CELL', 'FACE', or 'VERTEX'
 * @param {Object} computation - DelaunayComputation object
 */
export function applyAnalysisColoring(scene, meshGroups, analysisResults, coloringMode, computation) {
    console.log(`Applying analysis coloring in ${coloringMode} mode...`);
    console.log('Analysis results:', analysisResults);
    console.log('Mesh groups:', meshGroups);
    
    if (!isInitialized()) return;
    
    // Remove existing legend
    const existingLegend = document.getElementById('acuteness-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    switch (coloringMode) {
        case 'CELL':
            console.log('Applying cell coloring...');
            if (analysisResults.cellScores) {
                console.log('Cell scores:', analysisResults.cellScores);
                applyCellColoring(scene, meshGroups.voronoiFacesGroup, analysisResults.cellScores, computation);
            } else {
                console.warn('No cell scores available');
            }
            break;
        case 'FACE':
            console.log('Applying face coloring...');
            if (analysisResults.faceScores) {
                console.log('Face scores:', analysisResults.faceScores);
                applyFaceColoring(scene, meshGroups.voronoiFacesGroup, analysisResults.faceScores, computation);
            } else {
                console.warn('No face scores available');
            }
            break;
        case 'VERTEX':
            console.log('Applying vertex coloring...');
            if (analysisResults.vertexScores) {
                console.log('Vertex scores:', analysisResults.vertexScores);
                applyVertexColoring(scene, meshGroups.voronoiGroup, analysisResults.vertexScores, computation);
            } else {
                console.warn('No vertex scores available');
            }
            break;
        default:
            console.warn(`Unknown coloring mode: ${coloringMode}`);
    }
}

/**
 * Remove all acuteness analysis coloring and legend
 */
export function removeAnalysisColoring() {
    console.log('Removing acuteness analysis coloring...');
    
    // Remove legend
    const existingLegend = document.getElementById('acuteness-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    console.log('Acuteness analysis coloring removed');
} 