import G6 from '@antv/g6';

// Haversine distance formula to calculate distance between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = angle => (angle * Math.PI) / 180;
  
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in miles
}

// Sample node data with latitude and longitude
const nodes = [
  {
    id: 'generalDentist',
    label: 'Dr. John Doe\nGeneral Dentist', // Updated label to include specialty
    fullName: 'Dr. John Doe',
    specialty: 'General Dentist',
    addressLine: '123 Main St',
    city: 'Los Angeles',
    state: 'CA',
    latitude: 34.0522,
    longitude: -118.2437,
    isMainNode: true
  },
  {
    id: 'specialist1',
    label: 'Dr. Jane Smith\nOrthodontist', // Updated label to include specialty
    fullName: 'Dr. Jane Smith',
    specialty: 'Orthodontist',
    addressLine: '456 Elm St',
    city: 'Los Angeles',
    state: 'CA',
    latitude: 34.0520,
    longitude: -118.2435,
    isMainNode: false
  },
  {
    id: 'specialist2',
    label: 'Dr. Alice Johnson\nPediatric Dentist', // Updated label to include specialty
    fullName: 'Dr. Alice Johnson',
    specialty: 'Pediatric Dentist',
    addressLine: '789 Pine St',
    city: 'Los Angeles',
    state: 'CA',
    latitude: 34.0622,
    longitude: -118.2537,
    isMainNode: false
  },
  {
    id: 'specialist3',
    label: 'Dr. Robert Lee\nEndodontist', // Updated label to include specialty
    fullName: 'Dr. Robert Lee',
    specialty: 'Endodontist',
    addressLine: '101 Maple St',
    city: 'Santa Monica',
    state: 'CA',
    latitude: 34.0195,
    longitude: -118.4912,
    isMainNode: false
  }
];

// Create edges with distances between the General Dentist and specialists
const edges = nodes
  .filter(node => node.id !== 'generalDentist') // Exclude the main node
  .map(node => ({
    source: 'generalDentist',
    target: node.id,
    label: `${haversineDistance(
      nodes[0].latitude, nodes[0].longitude, 
      node.latitude, node.longitude
    ).toFixed(2)} miles`,
    distanceInMiles: haversineDistance(
      nodes[0].latitude, nodes[0].longitude, 
      node.latitude, node.longitude
    ).toFixed(2)
  }));

// Graph data for G6
const data = {
  nodes,
  edges
};

// Create the G6 graph
const graph = new G6.Graph({
  container: 'container',
  width: 800,
  height: 600,
  defaultNode: {
    shape: 'circle', // Changed to 'circle' for bubble style
    size: [80],
    color: '#5B8FF9',
    style: {
      fill: '#9EC9FF',
      lineWidth: 2,
      stroke: '#5B8FF9',
      radius: 40, // Rounded edges for a bubble effect
    },
    labelCfg: {
      style: {
        fill: '#fff',
        fontSize: 12,
        textAlign: 'center',
        textBaseline: 'middle',
      }
    }
  },
  defaultEdge: {
    labelCfg: {
      autoRotate: true,
      style: {
        fontSize: 10,
        fill: '#000'
      }
    },
    style: {
      stroke: '#e2e2e2',
      lineWidth: 2,
      endArrow: {
        path: G6.Arrow.triangle(10, 10, 0),
        fill: '#e2e2e2'
      }
    }
  },
  modes: {
    default: ['drag-canvas', 'zoom-canvas']
  }
});

// Load the data into the graph
graph.data(data);

// Render the graph
graph.render();
