# Fabric-of-Space

[Live Demo](https://virtualorganics.github.io/Fabric-of-Space/)

An advanced 3D computational geometry visualization tool with **acuteness detection** capabilities, built upon the foundation of [Geogram-Three.js](https://github.com/VirtualOrganics/Geogram-Three.js). This project combines the computational power of [Geogram](https://github.com/BrunoLevy/geogram) with [Three.js](https://github.com/mrdoob/three.js) visualization and adds sophisticated geometric analysis features.

<p align="center">
  <img src="docs/Fabric_of_Space_1.png" alt="Fabric-of-Space Demo" width="35%">
  <img src="docs/Fabric_of_Space_2.png" alt="Acuteness Detection" width="35%"> 
</p>
<p align="center">
  <img src="docs/Fabric_of_Space_3.png" alt="Cell Analysis" width="35%">
  <img src="docs/Fabric_of_Space_4.png" alt="Vertex Analysis" width="35%">
</p>

## 🌟 Key Features

### **Core Capabilities**
- **3D Delaunay Triangulation**: Compute Delaunay tetrahedralization of 3D point sets
- **3D Voronoi Diagrams**: Generate Voronoi cells from Delaunay triangulation
- **Periodic Boundary Conditions**: Support for periodic (toroidal) domains
- **WebAssembly Performance**: Native-speed computation in the browser
- **Interactive 3D Visualization**: Real-time Three.js rendering with orbit controls

### **🔍 Acuteness Detection System** *(New!)*
Advanced geometric analysis tools that detect and visualize acute angles in 3D structures:

- **📐 Cell Acuteness**: Analyzes dihedral angles between adjacent faces in Voronoi cells
- **🔲 Face Acuteness**: Counts acute interior angles in Voronoi face polygons  
- **⚫ Vertex Acuteness**: Measures acute angles in Delaunay tetrahedra vertices
- **🎨 Color-Coded Visualization**: Blue-to-red gradient (blue = low acuteness, red = high acuteness)
- **📊 Interactive Legend**: Real-time color scale showing acuteness levels
- **🧪 Unit Testing**: Comprehensive test suite with geometric validation

## 🚀 Quick Start

### Online Demo
Try it instantly: **[Live Demo](https://virtualorganics.github.io/Fabric-of-Space/)**

### Local Development
```bash
# Clone the repository
git clone https://github.com/VirtualOrganics/Fabric-of-Space.git
cd Fabric-of-Space

# Start local server
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

## 🎮 Usage Guide

### Basic Controls
- **Points**: Number of random points to generate (4-2500)
- **Min Dist**: Minimum distance between generated points
- **Motion/Speed**: Point animation settings
- **Live Update**: Real-time triangulation updates
- **Periodic**: Toggle periodic boundary conditions
- **Ghost Cells**: Visualize periodic space wrapping

### 🔍 Acuteness Detection Controls
1. **Mode Dropdown**: Select analysis type:
   - **None**: Standard visualization
   - **Cell Acuteness**: Color cells by dihedral angle acuteness
   - **Face Acuteness**: Color faces by interior angle acuteness  
   - **Vertex Acuteness**: Color Voronoi vertices by tetrahedra acuteness

2. **Run Unit Tests**: Execute geometric validation tests
3. **Recompute Analysis**: Refresh analysis on current data

### Color Legend
- **🔵 Blue**: Low acuteness (few acute angles)
- **🟢 Green**: Medium acuteness  
- **🟡 Yellow**: High acuteness
- **🔴 Red**: Maximum acuteness (many acute angles)

## 🔬 Technical Details

### Acuteness Analysis Algorithms

#### **Cell Acuteness**
Analyzes 3D Voronoi cells for acute dihedral angles:
```javascript
// For each cell, calculate angles between adjacent Voronoi vertices
const angle = calculateAngle(vec1, vec2);
if (angle < Math.PI / 2) acuteCount++; // Count acute angles
```

#### **Face Acuteness** 
Examines 2D Voronoi faces for acute interior angles:
```javascript
// For each vertex in face, calculate interior angle
const vec1 = [prev[0] - curr[0], prev[1] - curr[1], prev[2] - curr[2]];
const vec2 = [next[0] - curr[0], next[1] - curr[1], next[2] - curr[2]];
const angle = calculateAngle(vec1, vec2);
```

#### **Vertex Acuteness**
Measures acute angles in Delaunay tetrahedra:
```javascript
// For each tetrahedron vertex, analyze edge angles
const edges = others.map(v => [v[0] - center[0], v[1] - center[1], v[2] - center[2]]);
const angles = [calculateAngle(edges[0], edges[1]), ...];
```

### Data Structures
- **`DelaunayComputation`**: Core triangulation and analysis engine
- **`GeometryAnalysis`**: Pure geometric calculation functions
- **`Visualizer`**: Three.js rendering and color mapping
- **Unit Tests**: Comprehensive validation with known geometries

## 🧪 Testing

### Built-in Test Suite
The project includes extensive unit tests:
```javascript
// Test geometric correctness with known shapes
testCubeGeometry();           // All angles should be 90° (non-acute)
testRegularTetrahedronGeometry(); // All angles should be 60° (acute)
testTriangularPrism();        // Mixed angle validation
```

### Running Tests
1. Open the application in your browser
2. Click **"Run Unit Tests"** button
3. Check browser console for detailed results
4. All tests should pass with ✅ green checkmarks

## 📚 API Reference

### Core Classes

#### `DelaunayComputation`
```javascript
const computation = new DelaunayComputation(points, isPeriodic);
await computation.compute(wasmModule);

// Access results
const tetrahedra = computation.getDelaunayTetrahedra();
const cells = computation.getCells();
const faces = computation.getFaces();
const vertices = computation.getVertices();
```

#### `GeometryAnalysis`
```javascript
import { analyzeAcuteness, vertexAcuteness, faceAcuteness, cellAcuteness } from './src/js/GeometryAnalysis.js';

// Run comprehensive analysis
const results = analyzeAcuteness(computation);
// Returns: { vertexScores: [...], faceScores: [...], cellScores: [...] }

// Individual analyses
const vertexScores = vertexAcuteness(computation);
const faceScores = faceAcuteness(computation);
const cellScores = cellAcuteness(computation);
```

#### `Visualizer`
```javascript
import * as Visualizer from './src/js/Visualizer.js';

// Initialize with THREE.js objects
Visualizer.initVisualizer(THREE, ConvexGeometry);

// Apply analysis coloring
Visualizer.applyAnalysisColoring(scene, meshGroups, analysisResults, 'CELL', computation);

// Remove analysis coloring
Visualizer.removeAnalysisColoring();
```

## 📊 Analysis Results Interpretation

### Understanding Acuteness Scores
- **Score 0**: No acute angles detected (e.g., perfect cube)
- **Low Scores (1-3)**: Few acute angles, generally regular geometry
- **Medium Scores (4-8)**: Moderate acuteness, some geometric irregularity
- **High Scores (9+)**: Many acute angles, highly irregular or "spiky" geometry

### Geometric Insights
- **High Cell Acuteness**: Indicates cells with sharp internal corners
- **High Face Acuteness**: Shows faces with pointed vertices
- **High Vertex Acuteness**: Reveals "sliver" tetrahedra in triangulation

## 🏗️ Project Structure

```
Fabric-of-Space/
├── 📄 index.html              # Main application
├── 📂 src/
│   ├── 📂 js/
│   │   ├── DelaunayComputation.js  # Core computation engine
│   │   ├── GeometryAnalysis.js     # Acuteness analysis algorithms
│   │   └── Visualizer.js           # Three.js visualization
│   └── 📂 cpp/                     # WASM source (from Geogram)
├── 📂 test/
│   └── GeometryAnalysis.test.js    # Unit test suite
├── 📂 dist/                        # Compiled WASM files
└── 📂 docs/                        # Documentation assets
```

## 🔧 Building from Source

### Prerequisites
- Emscripten SDK (for WASM compilation)
- Node.js (for development)
- C++17 compiler
- Python 3 (for local server)

### Build Steps
```bash
# Build WASM module (if modifying C++ code)
cd src/cpp
./build.sh

# Start development server
python3 -m http.server 8000
```

## 🎯 Use Cases

### Research Applications
- **Computational Geometry**: Study Voronoi diagram properties
- **Materials Science**: Analyze crystal structure irregularities  
- **Biology**: Examine cellular arrangements and acute interfaces
- **Physics**: Investigate particle packing and sharp boundaries

### Educational Use
- **Geometry Visualization**: Interactive 3D geometric concepts
- **Algorithm Demonstration**: Real-time triangulation algorithms
- **Mathematical Analysis**: Acute angle detection in 3D space

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- 🔬 Advanced analysis algorithms
- 🎨 Enhanced visualization options
- ⚡ Performance optimizations
- 📊 Export/import functionality
- 🧪 Additional test cases

## 📋 Roadmap

- [ ] 📈 Statistical analysis tools
- [ ] 💾 Data export (CSV, JSON)
- [ ] 🎛️ Advanced filtering options
- [ ] 🔍 Zoom-to-acute-regions feature
- [ ] 📱 Mobile-responsive design
- [ ] 🎯 Batch processing mode

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- **[Geogram](https://github.com/BrunoLevy/geogram)** by Bruno Levy - Core geometric algorithms
- **[Three.js](https://github.com/mrdoob/three.js)** - 3D visualization framework  
- **[Emscripten](https://emscripten.org/)** - WebAssembly compilation
- **[Geogram-Three.js](https://github.com/VirtualOrganics/Geogram-Three.js)** - Foundation project

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/VirtualOrganics/Fabric-of-Space/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/VirtualOrganics/Fabric-of-Space/discussions)
- 📧 **Contact**: Open an issue for questions

---

**Made with ❤️ for the computational geometry community**
