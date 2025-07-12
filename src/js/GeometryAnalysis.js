/**
 * GeometryAnalysis.js
 * 
 * Geometric analysis functions for acuteness detection in Delaunay-Voronoi diagrams.
 * This module provides pure geometric calculations without any dependency on Three.js.
 */

/**
 * Calculate the angle between two vectors in radians
 * @param {Array} vec1 - First vector [x, y, z]
 * @param {Array} vec2 - Second vector [x, y, z]
 * @returns {number} Angle in radians
 */
function calculateAngle(vec1, vec2) {
    // Calculate dot product
    const dot = vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    
    // Calculate magnitudes
    const mag1 = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1] + vec1[2] * vec1[2]);
    const mag2 = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1] + vec2[2] * vec2[2]);
    
    // Avoid division by zero
    if (mag1 === 0 || mag2 === 0) return 0;
    
    // Calculate angle using dot product formula
    const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2))); // Clamp to [-1, 1]
    return Math.acos(cosTheta);
}

/**
 * Calculate the dihedral angle between two faces sharing an edge
 * @param {Array} face1 - First face vertices [[x,y,z], ...]
 * @param {Array} face2 - Second face vertices [[x,y,z], ...]
 * @param {Array} commonEdge - The shared edge vertices [[x,y,z], [x,y,z]]
 * @returns {number} Dihedral angle in radians
 */
function getDihedralAngle(face1, face2, commonEdge) {
    // Helper function to calculate normal vector of a face
    function calculateNormal(vertices) {
        if (vertices.length < 3) return [0, 0, 0];
        
        // Use first three vertices to calculate normal
        const v1 = [
            vertices[1][0] - vertices[0][0],
            vertices[1][1] - vertices[0][1],
            vertices[1][2] - vertices[0][2]
        ];
        
        const v2 = [
            vertices[2][0] - vertices[0][0],
            vertices[2][1] - vertices[0][1],
            vertices[2][2] - vertices[0][2]
        ];
        
        // Cross product to get normal
        const normal = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
        
        return normal;
    }
    
    // Calculate normal vectors for both faces
    const normal1 = calculateNormal(face1);
    const normal2 = calculateNormal(face2);
    
    // Calculate the angle between the normals
    const angle = calculateAngle(normal1, normal2);
    
    // The dihedral angle is supplementary to the angle between normals
    return Math.PI - angle;
}

/**
 * Analyze vertex acuteness in the Delaunay triangulation
 * For each Delaunay tetrahedron, measure its "quality" or "shape"
 * A "spiky" Voronoi vertex corresponds to a "flat" or "sliver" Delaunay tetrahedron
 * @param {DelaunayComputation} computation - The computation object
 * @returns {Array} Array of acuteness scores for each tetrahedron
 */
export function vertexAcuteness(computation) {
    console.log('Computing vertex acuteness...');
    
    const tetrahedra = computation.getDelaunayTetrahedra();
    const points = computation.getPoints();
    const scores = [];
    
    for (let i = 0; i < tetrahedra.length; i++) {
        const tet = tetrahedra[i];
        const vertices = tet.map(idx => points[idx]);
        
        // Calculate solid angles at each vertex of the tetrahedron
        let acuteAngles = 0;
        
        // For each vertex, calculate the angles between the three edges
        for (let j = 0; j < 4; j++) {
            const center = vertices[j];
            const others = vertices.filter((_, idx) => idx !== j);
            
            // Calculate the three angles between pairs of edges
            const edges = others.map(v => [
                v[0] - center[0],
                v[1] - center[1],
                v[2] - center[2]
            ]);
            
            // Calculate angles between each pair of edges
            const angles = [
                calculateAngle(edges[0], edges[1]),
                calculateAngle(edges[1], edges[2]),
                calculateAngle(edges[2], edges[0])
            ];
            
            // Count acute angles (< 90 degrees)
            const acuteCount = angles.filter(angle => angle < Math.PI / 2).length;
            acuteAngles += acuteCount;
        }
        
        scores.push(acuteAngles);
    }
    
    console.log(`Vertex acuteness analysis complete. Max score: ${scores.length > 0 ? Math.max(...scores) : 0}`);
    return scores;
}

/**
 * Analyze face acuteness in the Voronoi diagram
 * For each Voronoi face, count the number of interior angles that are less than 90°
 * @param {DelaunayComputation} computation - The computation object
 * @returns {Array} Array of acuteness scores for each face
 */
export function faceAcuteness(computation) {
    console.log('Computing face acuteness...');
    
    const faces = computation.getFaces();
    const scores = [];
    
    console.log(`Analyzing ${faces.length} faces...`);
    
    for (const face of faces) {
        const vertices = face.voronoiVertices;
        
        if (vertices.length < 3) {
            scores.push(0);
            continue;
        }
        
        let acuteAngles = 0;
        
        // For a simple case, just analyze the triangle formed by the Voronoi vertices
        if (vertices.length === 2) {
            // This is an edge case - treat as a line segment with no interior angles
            scores.push(0);
            continue;
        }
        
        // For faces with vertices, calculate angles between consecutive edge vectors
        for (let i = 0; i < vertices.length; i++) {
            const prev = vertices[(i - 1 + vertices.length) % vertices.length];
            const curr = vertices[i];
            const next = vertices[(i + 1) % vertices.length];
            
            // Calculate vectors from current vertex to adjacent vertices
            const vec1 = [
                prev[0] - curr[0],
                prev[1] - curr[1],
                prev[2] - curr[2]
            ];
            
            const vec2 = [
                next[0] - curr[0],
                next[1] - curr[1],
                next[2] - curr[2]
            ];
            
            // Calculate the angle between the vectors
            const angle = calculateAngle(vec1, vec2);
            
            // Count if the angle is acute (< 90 degrees)
            if (angle < Math.PI / 2) {
                acuteAngles++;
            }
        }
        
        scores.push(acuteAngles);
    }
    
    console.log(`Face acuteness scores:`, scores);
    console.log(`Face acuteness analysis complete. Max score: ${scores.length > 0 ? Math.max(...scores) : 0}`);
    return scores;
}

/**
 * Analyze cell acuteness in the Voronoi diagram
 * For each Voronoi cell, count the number of dihedral angles that are less than 90°
 * @param {DelaunayComputation} computation - The computation object
 * @returns {Array} Array of acuteness scores for each cell
 */
export function cellAcuteness(computation) {
    console.log('Computing cell acuteness...');
    
    const cells = computation.getCells();
    const scores = [];
    
    console.log(`Analyzing ${cells.size} cells...`);
    
    // For each cell, analyze the angles at each Voronoi vertex 
    for (const [cellIdx, cellVertices] of cells.entries()) {
        if (cellVertices.length < 4) {
            scores.push(0);
            continue;
        }
        
        let acuteAngles = 0;
        
        // For each vertex in the cell, find angles between adjacent edges
        // This is more geometrically meaningful than all pairwise combinations
        for (let i = 0; i < cellVertices.length; i++) {
            const center = cellVertices[i];
            
            // Find the closest neighbors to form meaningful edges
            const otherVertices = cellVertices.filter((_, idx) => idx !== i);
            
            // Sort by distance to get closest neighbors
            otherVertices.sort((a, b) => {
                const distA = Math.sqrt(
                    (a[0] - center[0]) ** 2 + 
                    (a[1] - center[1]) ** 2 + 
                    (a[2] - center[2]) ** 2
                );
                const distB = Math.sqrt(
                    (b[0] - center[0]) ** 2 + 
                    (b[1] - center[1]) ** 2 + 
                    (b[2] - center[2]) ** 2
                );
                return distA - distB;
            });
            
            // Take up to 6 closest neighbors to avoid overcounting
            const maxNeighbors = Math.min(6, otherVertices.length);
            
            // Calculate angles between adjacent neighbor pairs
            for (let j = 0; j < maxNeighbors; j++) {
                for (let k = j + 1; k < maxNeighbors; k++) {
                    const v1 = otherVertices[j];
                    const v2 = otherVertices[k];
                    
                    // Calculate vectors from center to neighbors
                    const vec1 = [
                        v1[0] - center[0],
                        v1[1] - center[1],
                        v1[2] - center[2]
                    ];
                    
                    const vec2 = [
                        v2[0] - center[0],
                        v2[1] - center[1],
                        v2[2] - center[2]
                    ];
                    
                    // Calculate angle between vectors
                    const angle = calculateAngle(vec1, vec2);
                    
                    // Count if acute (< 90 degrees)
                    if (angle < Math.PI / 2) {
                        acuteAngles++;
                    }
                }
            }
        }
        
        // Normalize by cell size to get a reasonable score
        const normalizedScore = Math.round(acuteAngles / cellVertices.length);
        scores.push(normalizedScore);
    }
    
    console.log(`Cell acuteness scores:`, scores.slice(0, 10), '...');
    console.log(`Cell acuteness analysis complete. Max score: ${scores.length > 0 ? Math.max(...scores) : 0}`);
    return scores;
}

/**
 * Run all acuteness analyses
 * @param {DelaunayComputation} computation - The computation object
 * @returns {Object} Object containing all analysis results
 */
export function analyzeAcuteness(computation) {
    console.log('Running comprehensive acuteness analysis...');
    
    const results = {
        vertexScores: vertexAcuteness(computation),
        faceScores: faceAcuteness(computation),
        cellScores: cellAcuteness(computation)
    };
    
    console.log('Acuteness analysis complete:', {
        vertices: results.vertexScores.length,
        faces: results.faceScores.length,
        cells: results.cellScores.length
    });
    
    console.log('Analysis results summary:');
    console.log('- Vertex scores:', results.vertexScores.slice(0, 5), '...');
    console.log('- Face scores:', results.faceScores.slice(0, 5), '...');
    console.log('- Cell scores:', results.cellScores.slice(0, 5), '...');
    
    return results;
} 