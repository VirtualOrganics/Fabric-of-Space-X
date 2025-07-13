/**
 * GeometryAnalysis.js
 * 
 * Geometric analysis functions for acuteness detection in Delaunay-Voronoi diagrams.
 * This module provides pure geometric calculations without any dependency on Three.js.
 * 
 * STREAMLINED VERSION - Optimized for performance without overhead
 */

// Simple performance tracking (minimal overhead)
let performanceEnabled = false;
const simpleMetrics = {
    totalTime: 0,
    callCount: 0
};

/**
 * Enable/disable performance tracking
 */
export function setPerformanceTracking(enabled) {
    performanceEnabled = enabled;
}

/**
 * Get simple performance metrics
 */
export function getPerformanceMetrics() {
    return {
        cellAcuteness: {
            totalTime: simpleMetrics.totalTime,
            callCount: simpleMetrics.callCount,
            averageTime: simpleMetrics.callCount > 0 ? simpleMetrics.totalTime / simpleMetrics.callCount : 0,
            angleCalculations: 0,
            anglesPerMs: 0
        },
        faceAcuteness: { totalTime: 0, callCount: 0, averageTime: 0, angleCalculations: 0, anglesPerMs: 0 },
        vertexAcuteness: { totalTime: 0, callCount: 0, averageTime: 0, angleCalculations: 0, anglesPerMs: 0 }
    };
}

/**
 * Clear performance data
 */
export function clearPerformanceData() {
    simpleMetrics.totalTime = 0;
    simpleMetrics.callCount = 0;
}

/**
 * Calculate squared distance between two points (faster than actual distance)
 */
function calculateSquaredDistance(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    return dx * dx + dy * dy + dz * dz;
}

/**
 * Calculate the angle between two vectors in radians (FAST VERSION)
 */
function calculateAngle(vec1, vec2) {
    // Calculate dot product
    const dot = vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
    
    // Calculate squared magnitudes (avoid sqrt until necessary)
    const magSq1 = vec1[0] * vec1[0] + vec1[1] * vec1[1] + vec1[2] * vec1[2];
    const magSq2 = vec2[0] * vec2[0] + vec2[1] * vec2[1] + vec2[2] * vec2[2];
    
    // Avoid division by zero
    if (magSq1 === 0 || magSq2 === 0) return 0;
    
    // Calculate angle using dot product formula
    const cosTheta = Math.max(-1, Math.min(1, dot / Math.sqrt(magSq1 * magSq2)));
    return Math.acos(cosTheta);
}

/**
 * Calculate the dihedral angle between two faces sharing an edge
 */
function getDihedralAngle(face1, face2, commonEdge) {
    // Helper function to calculate normal vector of a face
    function calculateNormal(vertices) {
        if (vertices.length < 3) return [0, 0, 0];
        
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
    
    const normal1 = calculateNormal(face1);
    const normal2 = calculateNormal(face2);
    const angle = calculateAngle(normal1, normal2);
    return Math.PI - angle;
}

/**
 * Analyze vertex acuteness in the Delaunay triangulation (FAST VERSION)
 */
export function vertexAcuteness(computation, maxScore = Infinity) {
    const tetrahedra = computation.getDelaunayTetrahedra();
    const points = computation.getPoints();
    const scores = [];
    
    for (let i = 0; i < tetrahedra.length; i++) {
        const tet = tetrahedra[i];
        const vertices = tet.map(idx => points[idx]);
        
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
        
        // Early termination if we've reached max score
        if (acuteAngles >= maxScore) break;
    }
    
    return scores;
}

/**
 * Analyze face acuteness in the Voronoi diagram (FAST VERSION)
 */
export function faceAcuteness(computation, maxScore = Infinity) {
    const faces = computation.getFaces();
    const scores = [];
    
    for (const face of faces) {
        const vertices = face.voronoiVertices;
        
        if (vertices.length < 3) {
            scores.push(0);
            continue;
        }
        
        let acuteAngles = 0;
        
        // Calculate interior angles of the polygon
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
        
        // Early termination if we've reached max score
        if (acuteAngles >= maxScore) break;
    }
    
    return scores;
}

/**
 * Analyze cell acuteness in the Voronoi diagram (FAST VERSION - No Spatial Index)
 */
export function cellAcuteness(computation, maxScore = Infinity, searchRadius = 0.3) {
    const startTime = performanceEnabled ? performance.now() : 0;
    
    const cells = computation.getCells();
    const scores = [];
    
    // For each cell, analyze the angles at each Voronoi vertex 
    for (const [cellIdx, cellVertices] of cells.entries()) {
        if (cellVertices.length < 4) {
            scores.push(0);
            continue;
        }
        
        let acuteAngles = 0;
        
        // For each vertex in the cell, find angles between adjacent edges
        for (let i = 0; i < cellVertices.length; i++) {
            const center = cellVertices[i];
            
            // Simple approach: just use all other vertices in the cell
            const otherVertices = cellVertices.filter((_, idx) => idx !== i);
            
            // Sort by distance using squared distance (faster)
            otherVertices.sort((a, b) => {
                const distSqA = calculateSquaredDistance(center, a);
                const distSqB = calculateSquaredDistance(center, b);
                return distSqA - distSqB;
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
        
        // Early termination if we've reached max score
        if (normalizedScore >= maxScore) break;
    }
    
    // Record simple performance metrics
    if (performanceEnabled) {
        const endTime = performance.now();
        simpleMetrics.totalTime += endTime - startTime;
        simpleMetrics.callCount++;
    }
    
    return scores;
}

/**
 * Run all acuteness analyses (STREAMLINED VERSION)
 */
export function analyzeAcuteness(computation, options = {}) {
    const { 
        maxScore = Infinity, 
        includePerformance = false,  // Default to false for speed
        searchRadius = 0.3
    } = options;
    
    // Enable performance tracking only if requested
    setPerformanceTracking(includePerformance);
    
    const analysisStartTime = includePerformance ? performance.now() : 0;
    
    const results = {
        vertexScores: vertexAcuteness(computation, maxScore),
        faceScores: faceAcuteness(computation, maxScore),
        cellScores: cellAcuteness(computation, maxScore, searchRadius)
    };
    
    if (includePerformance) {
        const analysisEndTime = performance.now();
        const totalDuration = analysisEndTime - analysisStartTime;
        
        results.performance = {
            totalTime: totalDuration,
            metrics: getPerformanceMetrics(),
            cacheStats: {
                cacheSize: 0,
                maxCacheSize: 0
            }
        };
    }
    
    return results;
}

// Remove the complex spatial index class - it was causing more overhead than benefit
// The simple sorting approach is actually faster for typical dataset sizes 