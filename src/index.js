import data from './va_dental_providers.json'; 
import G6 from '@antv/g6';
const specialtyColors = {
    'General Dentist': '#FF6B6B',
    'Orthodontist': '#4ECDC4',
    'Pediatric Dentist': '#45B7D1',
    'Endodontist': '#96CEB4',
    'Oral Surgeon': '#FECA57',
    'Periodontist': '#FF9FF3',
    'Oral and Maxillofacial Radiologist': '#A8E6CF',
    'Prosthodontist': '#FFB6C1',
    'Public Health Dentist': '#DDA0DD',
    'Oral Pathologist': '#F0E68C',
    'default': '#95A5A6'
};



// Global variables
let graph;
let originalNodes = [];
let originalEdges = [];
let filteredNodes = [];
let filteredEdges = [];
let selectedCities = [];
let transformedData = [];

// async function fetchJSONData() {
//     try {
//         try {
//             const importedData = await import('./va_dental_providers.json');
//             return importedData.default || importedData.s;

//         } catch (importError) {
//             console.log('Direct import failed, trying fetch:', importError.message);
//         }

//         // If import fails, try fetching
//         const response = await fetch('/va_dental_providers.json');
        
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         const contentType = response.headers.get('content-type');
//         if (!contentType || !contentType.includes('application/json')) {
//             throw new Error("Response wasn't JSON");
//         }
        
//         const data = await response.json();
//         console.log('Successfully loaded data via fetch');
//         return data;
//     } catch (error) {
//         console.warn('Failed to load JSON data:', error.message);
//     }
// }
async function fetchJSONData() {
    try {
        let data;
        
        // First try to use the imported JSON directly
        try {
            const importedData = await import('./va_dental_providers.json');
            data = importedData.default || importedData;
            console.log('Successfully loaded data from direct import');
        } catch (importError) {
            console.log('Direct import failed, trying fetch:', importError.message);
            
            // If import fails, try fetching
            const response = await fetch('/va_dental_providers.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error("Response wasn't JSON");
            }
            
            data = await response.json();
            console.log('Successfully loaded data via fetch');
        }

        // Limit to first 100 records
        if (Array.isArray(data)) {
            return data.slice(0, 100);
        } else if (typeof data === 'object' && data !== null) {
            // If it's an object, try to find an array property
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    return data[key].slice(0, 100);
                }
            }
        }
        
        // If we can't find an array, return empty array
        console.warn('No array data found in JSON');
        return [];

    } catch (error) {
        console.warn('Failed to load JSON data:', error.message);
    }
}

function showErrorMessage(message) {
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 6px; margin: 10px 0;">
                <strong>⚠️ Error:</strong> ${message}
            </div>
        `;
        resultsDiv.style.display = 'block';
    }
}
// transformProviderData(EMBEDDED_PROVIDER_DATA);
function transformProviderData(providerData) {
    transformedData = [];
    
    let nodeId = 0;

    if (!providerData || providerData.length === 0) {
        console.warn('No provider data available');
        return;
    }
   const limitedProviders = providerData.slice(0, 100);

    limitedProviders.forEach(provider => {
        // Handle each clinic address separately
        if (provider.clinicAddresses && provider.clinicAddresses.length > 0) {
            provider.clinicAddresses.forEach(clinic => {
                const specialty = provider.specialties && provider.specialties.length > 0 
                    ? provider.specialties[0].name 
                    : 'General Dentist';
                
                const isHub = specialty === 'General Dentist';
                
                transformedData.push({
                    id: `node${nodeId}`,
                    label: nodeId.toString(),
                    fullName: provider.fullName || `${provider.firstName || ''} ${provider.lastName || ''}`.trim(),
                    firstName: provider.firstName || '',
                    lastName: provider.lastName || '',
                    specialty: specialty,
                    clinicName: clinic.clinicName || 'Unknown Clinic',
                    addressLine: clinic.streetName || 'Unknown Address',
                    city: clinic.city || 'Unknown City',
                    state: clinic.stateCode || 'VA',
                    zipCode: clinic.zipCode || '00000',
                    latitude: clinic.latitude || 37.5407,
                    longitude: clinic.longitude || -77.4360,
                    phoneNumber: provider.phoneNumber || '',
                    clinicPhone: clinic.phoneNumber || '',
                    email: provider.email && provider.email.length > 0 ? provider.email[0] : '',
                    clinicEmail: clinic.clinicEmail && clinic.clinicEmail.length > 0 ? clinic.clinicEmail[0] : '',
                    website: provider.website || clinic.website || '',
                    npiNumber: provider.npiNumber || '',
                    active: clinic.active !== undefined ? clinic.active : true,
                    verified: clinic.verified !== undefined ? clinic.verified : true,
                    confidenceScore: clinic.confidenceScore || 0,
                    claimed: clinic.claimed !== undefined ? clinic.claimed : false,
                    insurances: clinic.insurances || [],
                    isHub: isHub
                });
                nodeId++;
            });
        }
    });

    console.log('Transformed data:', transformedData);
    initializeGraphData();
}

// Initialize everything
// Update the DOMContentLoaded event listener
// document.addEventListener('DOMContentLoaded', () => {
//     fetchJSONData().then(() => {
//         initializeCityDropdown();
//         setupCityDropdown();
//         initializeSpecialtyDropdown();
//         setupGraphEvents();
//         setupSearchEvents();
//         initializeGraph();
//     });
    
//     window.addEventListener('resize', handleResize);
// });
document.addEventListener('DOMContentLoaded', () => {
    transformProviderData(data);
    initializeCityDropdown();
    setupCityDropdown();
    initializeGraphData();
    initializeGraph();
    setupGraphEvents();
    setupSearchEvents();
    
    window.addEventListener('resize', handleResize);
});
// Haversine distance formula
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = angle => (angle * Math.PI) / 180;
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Initialize city dropdown
function initializeCityDropdown() {
    if (transformedData.length === 0) return;
    
    const cities = [...new Set(transformedData.map(clinic => clinic.city))].sort();
    const cityDropdown = document.getElementById('cityDropdown');
    
    if (!cityDropdown) return;
    
    cityDropdown.innerHTML = cities.map(city => {
        const zipCodes = transformedData
            .filter(clinic => clinic.city === city)
            .map(clinic => clinic.zipCode)
            .filter((zip, index, arr) => arr.indexOf(zip) === index)
            .sort();
        
        return `
            <div class="multi-select-option" data-city="${city}">
                <input type="checkbox" class="multi-select-checkbox" id="city-${city}">
                <label for="city-${city}">${city} (${zipCodes.join(', ')})</label>
            </div>
        `;
    }).join('');
}

// Initialize specialty dropdown
function initializeSpecialtyDropdown() {
    if (transformedData.length === 0) return;
    
    const specialties = [...new Set(transformedData.map(clinic => clinic.specialty))].sort();
    const specialtySelect = document.getElementById('specialtyFilter');
    
    if (!specialtySelect) return;
    
    // Clear existing options except the first one
    specialtySelect.innerHTML = '<option value="">All Specialties</option>';
    
    specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtySelect.appendChild(option);
    });
}

// City dropdown functionality
function setupCityDropdown() {
    const trigger = document.getElementById('cityTrigger');
    const dropdown = document.getElementById('cityDropdown');
    
    if (!trigger || !dropdown) return;
    
    trigger.addEventListener('click', () => {
        dropdown.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
    
    dropdown.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const city = e.target.closest('.multi-select-option').dataset.city;
            if (e.target.checked) {
                if (!selectedCities.includes(city)) {
                    selectedCities.push(city);
                }
            } else {
                selectedCities = selectedCities.filter(c => c !== city);
            }
            updateCityDisplay();
        }
    });
}

function updateCityDisplay() {
    const displayText = document.getElementById('cityDisplayText');
    const selectedCitiesContainer = document.getElementById('selectedCities');
    
    if (!displayText) return;
    
    if (selectedCities.length === 0) {
        displayText.textContent = 'All Cities';
        if (selectedCitiesContainer) selectedCitiesContainer.innerHTML = '';
    } else {
        displayText.textContent = `${selectedCities.length} cities selected`;
        if (selectedCitiesContainer) {
            selectedCitiesContainer.innerHTML = selectedCities.map(city => `
                <div class="city-tag">
                    ${city}
                    <span class="city-tag-remove" data-city="${city}">×</span>
                </div>
            `).join('');
        }
    }
}

// Remove city tag
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('city-tag-remove')) {
        const city = e.target.dataset.city;
        selectedCities = selectedCities.filter(c => c !== city);
        const checkbox = document.getElementById(`city-${city}`);
        if (checkbox) checkbox.checked = false;
        updateCityDisplay();
    }
});

// Filter functions
function applyFilters() {
    const nameSearch = document.getElementById('nameSearch');
    const specialtyFilter = document.getElementById('specialtyFilter');
    
    const nameSearchValue = nameSearch ? nameSearch.value.toLowerCase() : '';
    const specialtyFilterValue = specialtyFilter ? specialtyFilter.value : '';
    
    filteredNodes = originalNodes.filter(node => {
        const matchesCity = selectedCities.length === 0 || selectedCities.includes(node.city);
        const matchesName = !nameSearchValue || 
            node.fullName.toLowerCase().includes(nameSearchValue) ||
            node.clinicName.toLowerCase().includes(nameSearchValue) ||
            `${node.firstName} ${node.lastName}`.toLowerCase().includes(nameSearchValue);
        const matchesSpecialty = !specialtyFilterValue || node.specialty === specialtyFilterValue;
        
        return matchesCity && matchesName && matchesSpecialty;
    });
    
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    filteredEdges = originalEdges.filter(edge => 
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
    
    updateGraph();
    showSearchResults();
}

function findConnections() {
    const specialists = filteredNodes.filter(node => !node.isHub);
    const generalDentists = filteredNodes.filter(node => node.isHub);
    
    const connectionStats = {};
    const allConnections = [];
    
    specialists.forEach(specialist => {
        let nearestHub = null;
        let minDistance = Infinity;
        
        generalDentists.forEach(hub => {
            const distance = haversineDistance(
                specialist.latitude, specialist.longitude,
                hub.latitude, hub.longitude
            );
            
            if (distance < minDistance && distance <= 25) {
                minDistance = distance;
                nearestHub = hub;
            }
        });
        
        if (nearestHub) {
            const hubId = nearestHub.id;
            if (!connectionStats[hubId]) {
                connectionStats[hubId] = {
                    hub: nearestHub,
                    specialists: [],
                    totalConnections: 0
                };
            }
            
            connectionStats[hubId].specialists.push({
                specialist: specialist,
                distance: minDistance
            });
            connectionStats[hubId].totalConnections++;
            
            allConnections.push({
                hub: nearestHub,
                specialist: specialist,
                distance: minDistance
            });
        }
    });
    
    showConnectionResults(connectionStats, allConnections);
}

function showConnectionResults(connectionStats, allConnections) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    const sortedHubs = Object.values(connectionStats)
        .sort((a, b) => b.totalConnections - a.totalConnections);
    
    let resultsHtml = '<div style="margin-bottom: 16px;"><strong>🔗 Connection Analysis Results:</strong></div>';
    
    if (sortedHubs.length === 0) {
        resultsHtml += '<p>No connections found within 25-mile radius for the filtered clinics.</p>';
    } else {
        resultsHtml += `<div style="margin-bottom: 12px;">Found ${allConnections.length} total connections across ${sortedHubs.length} hub(s):</div>`;
        
        sortedHubs.forEach((hubData, index) => {
            const avgDistance = hubData.specialists.reduce((sum, s) => sum + s.distance, 0) / hubData.specialists.length;
            resultsHtml += `
                <div style="background: white; padding: 8px; margin: 8px 0; border-radius: 4px; border-left: 4px solid ${specialtyColors[hubData.hub.specialty] || specialtyColors.default};">
                    <strong>#${index + 1} ${hubData.hub.fullName}</strong> (${hubData.hub.city})<br>
                    <small>Connections: ${hubData.totalConnections} | Avg Distance: ${avgDistance.toFixed(1)}mi</small><br>
                    <small>Specialists: ${hubData.specialists.map(s => s.specialist.specialty).join(', ')}</small>
                </div>
            `;
        });
        
        // Add detailed connections list
        resultsHtml += '<div style="margin-top: 16px;"><strong>Detailed Connections:</strong></div>';
        allConnections
            .sort((a, b) => a.distance - b.distance)
            .forEach(conn => {
                resultsHtml += `
                    <div style="background: #f8f9fa; padding: 6px; margin: 4px 0; border-radius: 3px; font-size: 12px;">
                        <strong>${conn.specialist.fullName}</strong> (${conn.specialist.specialty}) 
                        → <strong>${conn.hub.fullName}</strong> 
                        <span style="float: right; color: #666;">${conn.distance.toFixed(1)}mi</span>
                    </div>
                `;
            });
    }
    
    resultsDiv.innerHTML = resultsHtml;
    resultsDiv.style.display = 'block';
}

function showSearchResults() {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    const hubCount = filteredNodes.filter(n => n.isHub).length;
    const specialistCount = filteredNodes.filter(n => !n.isHub).length;
    const connectionCount = filteredEdges.length;
    
    let resultsHtml = `
        <div><strong>🔍 Search Results:</strong></div>
        <div style="margin-top: 8px;">
            Found ${filteredNodes.length} clinics: ${hubCount} hubs, ${specialistCount} specialists with ${connectionCount} connections
        </div>
    `;
    
    if (filteredNodes.length === 0) {
        resultsHtml += '<div style="margin-top: 8px; color: #ef4444;">No clinics match your search criteria.</div>';
    }
    
    resultsDiv.innerHTML = resultsHtml;
    resultsDiv.style.display = 'block';
}

function clearFilters() {
    selectedCities = [];
    const nameSearch = document.getElementById('nameSearch');
    const specialtyFilter = document.getElementById('specialtyFilter');
    
    if (nameSearch) nameSearch.value = '';
    if (specialtyFilter) specialtyFilter.value = '';
    
    // Uncheck all city checkboxes
    document.querySelectorAll('.multi-select-checkbox').forEach(cb => cb.checked = false);
    updateCityDisplay();
    
    filteredNodes = [...originalNodes];
    filteredEdges = [...originalEdges];
    updateGraph();
    
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) resultsDiv.style.display = 'none';
}

function updateGraph() {
    if (graph) {
        graph.changeData({ nodes: filteredNodes, edges: filteredEdges });
        graph.fitView(40);
    }
}

// Update details panel function
function updateDetailsPanel(nodeData) {
    debugger
            console.log('Updating details panel with:', nodeData);
            const desktopPanel = document.getElementById('details-panel');
            
            if (!desktopPanel) {
                console.error('Details panel not found');
                return;
            }
            
            const content = `
                <div style="text-align: center;">
                    <div class="clinic-avatar" style="background-color: ${specialtyColors[nodeData.specialty] || specialtyColors.default}; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; margin: 0 auto 10px;">
                        ${nodeData.label}
                    </div>
                    <div class="clinic-name" style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${nodeData.fullName}</div>
                    <div class="clinic-specialty" style="color: ${specialtyColors[nodeData.specialty] || specialtyColors.default}; font-weight: 500; margin-bottom: 8px;">${nodeData.specialty}</div>
                    ${nodeData.isHub ? '<div class="hub-badge" style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-block;">HUB NODE</div>' : ''}
                </div>
                
                <div class="section" style="margin-top: 16px;">
                    <div class="section-title" style="font-weight: bold; margin-bottom: 8px;">📍 Location</div>
                    <div class="section-content" style="font-size: 14px; line-height: 1.4;">
                        <p><strong>Clinic:</strong> ${nodeData.clinicName || 'N/A'}</p>
                        <p>${nodeData.addressLine}</p>
                        <p>${nodeData.city}, ${nodeData.state} ${nodeData.zipCode}</p>
                        <p style="font-size: 12px; color: #666;">Lat: ${nodeData.latitude.toFixed(4)}, Lng: ${nodeData.longitude.toFixed(4)}</p>
                    </div>
                </div>
                
                <div class="section" style="margin-top: 16px;">
                    <div class="section-title" style="font-weight: bold; margin-bottom: 8px;">📞 Contact</div>
                    <div class="section-content" style="font-size: 14px; line-height: 1.4;">
                        ${nodeData.phoneNumber ? `<p><strong>Phone:</strong> ${nodeData.phoneNumber}</p>` : ''}
                        ${nodeData.clinicPhone && nodeData.clinicPhone !== nodeData.phoneNumber ? `<p><strong>Clinic:</strong> ${nodeData.clinicPhone}</p>` : ''}
                        ${nodeData.email ? `<p><strong>Email:</strong> ${nodeData.email}</p>` : ''}
                        ${nodeData.website ? `<p><strong>Website:</strong> <a href="${nodeData.website}" target="_blank" style="color: #3b82f6;">${nodeData.website}</a></p>` : ''}
                    </div>
                </div>
                
             
                
                <div class="section" style="margin-top: 16px;">
                    <div class="section-title" style="font-weight: bold; margin-bottom: 8px;">🔗 Connections</div>
                    <div id="connections-list" class="section-content" style="font-size: 14px;">
                        <p style="font-style: italic;">Loading connections...</p>
                    </div>
                </div>
            `;
            
            desktopPanel.innerHTML = content;
            updateConnectionsList(nodeData);
        }


function updateConnectionsList(nodeData) {
    const connectionsElements = document.querySelectorAll('#connections-list');
    
    const connections = filteredEdges.filter(edge => 
        edge.source === nodeData.id || edge.target === nodeData.id
    );
    
    let connectionsHtml = '';
    if (connections.length === 0) {
        connectionsHtml = '<p style="color: #9ca3af; font-style: italic;">No connections within range</p>';
    } else {
        connections.forEach(connection => {
            const connectedNodeId = connection.source === nodeData.id ? connection.target : connection.source;
            const connectedNode = transformedData.find(clinic => clinic.id === connectedNodeId);
            if (connectedNode) {
                connectionsHtml += `
                    <div class="connection-item" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
                        <div class="connection-info" style="display: flex; align-items: center;">
                            <div class="connection-dot" style="width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; background-color: ${specialtyColors[connectedNode.specialty] || specialtyColors.default}"></div>
                            <span class="connection-name">${connectedNode.fullName}</span>
                        </div>
                        <span class="connection-distance" style="font-size: 12px; color: #666;">${connection.label}</span>
                    </div>
                `;
            }
        });
    }
    
    connectionsElements.forEach(element => {
        element.innerHTML = connectionsHtml;
    });
}

function findNearestGeneralDentist(specialist, generalDentists) {
    let nearest = null;
    let minDistance = Infinity;
    
    generalDentists.forEach(gd => {
        const distance = haversineDistance(
            specialist.latitude, specialist.longitude,
            gd.latitude, gd.longitude
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = gd;
        }
    });
    
    return { dentist: nearest, distance: minDistance };
}

// Initialize graph data
function initializeGraphData() {
    if (transformedData.length === 0) {
        originalNodes = [];
        originalEdges = [];
        filteredNodes = [];
        filteredEdges = [];
        return;
    }
    
    const generalDentists = transformedData.filter(clinic => clinic.isHub);
    const specialists = transformedData.filter(clinic => !clinic.isHub);

    originalNodes = transformedData.map(clinic => ({
        id: clinic.id,
        label: clinic.label,
        fullName: clinic.fullName,
        firstName: clinic.firstName,
        lastName: clinic.lastName,
        specialty: clinic.specialty,
        clinicName: clinic.clinicName,
        addressLine: clinic.addressLine,
        city: clinic.city,
        state: clinic.state,
        zipCode: clinic.zipCode,
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        phoneNumber: clinic.phoneNumber,
        clinicPhone: clinic.clinicPhone,
        email: clinic.email,
        clinicEmail: clinic.clinicEmail,
        website: clinic.website,
        npiNumber: clinic.npiNumber,
        active: clinic.active,
        verified: clinic.verified,
        confidenceScore: clinic.confidenceScore,
        claimed: clinic.claimed,
        insurances: clinic.insurances,
        isHub: clinic.isHub,
        size: clinic.isHub ? 50 : 30,
        style: {
            fill: specialtyColors[clinic.specialty] || specialtyColors.default,
            stroke: '#2c3e50',
            lineWidth: clinic.isHub ? 3 : 2
        }
    }));

    originalEdges = [];
    specialists.forEach(specialist => {
        const nearest = findNearestGeneralDentist(specialist, generalDentists);
        if (nearest.dentist && nearest.distance <= 25) {
            originalEdges.push({
                source: nearest.dentist.id,
                target: specialist.id,
                label: `${nearest.distance.toFixed(1)}mi`,
                distance: nearest.distance,
                style: {
                    stroke: nearest.distance < 10 ? '#27ae60' : 
                           nearest.distance < 20 ? '#f39c12' : '#e74c3c',
                    lineWidth: 2,
                    lineDash: nearest.distance > 15 ? [5, 5] : null
                }
            });
        }
    });

    filteredNodes = [...originalNodes];
    filteredEdges = [...originalEdges];
}

// Initialize graph
function initializeGraph() {
    const container = document.getElementById('graph-container');
    if (!container) {
        console.error('Graph container not found');
        return;
    }

    // Check if G6 is available
    if (typeof G6 === 'undefined') {
        console.error('G6 library not loaded');
        showErrorMessage('Graph visualization library (G6) not loaded. Please ensure the G6 script is included.');
        return;
    }

    graph = new G6.Graph({
        container: 'graph-container',
        width: container.clientWidth,
        height: container.clientHeight,
        modes: {
            default: ['drag-canvas', 'zoom-canvas', 'drag-node']
        },
        defaultNode: {
            type: 'circle',
            labelCfg: {
                position: 'center',
                style: {
                    fill: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textBaseline: 'middle'
                }
            }
        },
        defaultEdge: {
            type: 'line',
            labelCfg: {
                autoRotate: true,
                style: {
                    fontSize: 9,
                    fill: '#666',
                    background: {
                        fill: '#fff',
                        padding: [2, 4],
                        radius: 2
                    }
                }
            }
        },
        layout: {
            type: 'force',
            preventOverlap: true,
            nodeSize: 30,
            linkDistance: 150,
            nodeStrength: -30,
            edgeStrength: 0.8,
            collideStrength: 0.8
        }
    });

    if (filteredNodes.length > 0) {
        graph.data({ nodes: filteredNodes, edges: filteredEdges });
        graph.render();

        setTimeout(() => {
            graph.fitView(40);
        }, 1000);
    } else {
        // Show message when no data is available
        showErrorMessage('No data available to display. Please ensure the va_dental_providers.json file contains valid data.');
    }
}

// Event handlers
function setupGraphEvents() {
    debugger
    if (!graph) return;

    // Highlight node and show details on hover
    graph.on('node:mouseenter', (e) => {
        debugger
        const nodeModel = e.item.getModel();
        updateDetailsPanel(nodeModel);
        
        // Highlight the hovered node
        graph.updateItem(e.item, {
            style: {
                ...nodeModel.style,
                stroke: '#ff4757', // Red border for hover
                lineWidth: 4
            }
        });
        
        // Highlight connected edges
        graph.getEdges().forEach(edge => {
            const edgeModel = edge.getModel();
            if (edgeModel.source === nodeModel.id || edgeModel.target === nodeModel.id) {
                graph.updateItem(edge, {
                    style: {
                        ...edgeModel.style,
                        opacity: 1,
                        lineWidth: 3
                    }
                });
            } else {
                graph.updateItem(edge, {
                    style: {
                        ...edgeModel.style,
                        opacity: 0.3
                    }
                });
            }
        });
    });

    // Reset node style when mouse leaves
    graph.on('node:mouseleave', (e) => {
        const nodeModel = e.item.getModel();
        graph.updateItem(e.item, {
            style: nodeModel.style // Reset to original style
        });
        
        // Reset all edges
        graph.getEdges().forEach((edge, index) => {
            const originalEdge = filteredEdges[index];
            if (originalEdge) {
                graph.updateItem(edge, {
                    style: {
                        ...originalEdge.style,
                        opacity: 1,
                        lineWidth: originalEdge.style.lineWidth
                    }
                });
            }
        });
    });

    // Show details on click (with more persistent highlighting)
    graph.on('node:click', (e) => {
        const clickedNode = e.item.getModel();
        debugger
        updateDetailsPanel(clickedNode);
        
        // Highlight the clicked node more prominently
        graph.updateItem(e.item, {
            style: {
                ...clickedNode.style,
                stroke: '#2c3e50', // Dark border for click
                lineWidth: 5
            }
        });
        
        // Highlight connected edges
        graph.getEdges().forEach(edge => {
            const edgeModel = edge.getModel();
            if (edgeModel.source === clickedNode.id || edgeModel.target === clickedNode.id) {
                graph.updateItem(edge, {
                    style: {
                        ...edgeModel.style,
                        opacity: 1,
                        lineWidth: 4,
                        stroke: '#2c3e50'
                    }
                });
            } else {
                graph.updateItem(edge, {
                    style: {
                        ...edgeModel.style,
                        opacity: 0.2
                    }
                });
            }
        });
    });

    // Reset everything when clicking on canvas
    graph.on('canvas:click', () => {
        // Reset all nodes
        graph.getNodes().forEach(node => {
            debugger
            const nodeModel = node.getModel();
            graph.updateItem(node, {
                style: nodeModel.style
            });
        });
        
        // Reset all edges
        graph.getEdges().forEach((edge, index) => {
            const originalEdge = filteredEdges[index];
            if (originalEdge) {
                graph.updateItem(edge, {
                    style: {
                        ...originalEdge.style,
                        opacity: 1,
                        lineWidth: originalEdge.style.lineWidth
                    }
                });
            }
        });
        
        debugger
        const desktopPanel = document.getElementById('details-panel');
        // const mobilePanel = document.getElementById('mobile-details-panel');
        if (desktopPanel) {
            desktopPanel.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">🦷</div>
                    <p><strong>Click or hover on a node</strong></p>
                    <p>to view clinic details</p>
                </div>
            `;
        }
        // if (mobilePanel) {
        //     mobilePanel.innerHTML = `
        //         <div class="placeholder">
        //             <div class="placeholder-icon">🦷</div>
        //             <p><strong>Tap on a node to view clinic details</strong></p>
        //         </div>
        //     `;
        // }
    });
}
// Event listeners for search functionality
function setupSearchEvents() {
    document.getElementById('searchBtn').addEventListener('click', applyFilters);
    document.getElementById('findConnectionBtn').addEventListener('click', findConnections);
    document.getElementById('clearBtn').addEventListener('click', clearFilters);
    
    // Real-time search on name input
    document.getElementById('nameSearch').addEventListener('input', () => {
        // Debounce the search
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(applyFilters, 300);
    });
    
    document.getElementById('specialtyFilter').addEventListener('change', applyFilters);
}

// Responsive handling
function handleResize() {
    const container = document.getElementById('graph-container');
    const rect = container.getBoundingClientRect();
    graph.changeSize(rect.width, rect.height);
    graph.fitView(40);
}

