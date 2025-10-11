// Schema Validator Web UI - Public Demo Version
class SchemaValidatorApp {
    constructor() {
        // Use environment variable for API URL, fallback to localhost for development
        this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        this.isDemo = true; // Mark as demo version
        
        this.endpoints = this.loadEndpoints();
        this.initializeEventListeners();
        this.renderEndpoints();
        this.updateEndpointCount();
        this.logToConsole(`🌐 Demo mode - API URL: ${this.apiUrl}`, 'info');
        this.loadConfigFromServer();
        
        // Add edit schema modal to DOM
        this.addEditSchemaModal();
    }

    // Load configuration from server
    async loadConfigFromServer() {
        try {
            const response = await fetch(`${this.apiUrl}/api/config`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const config = await response.json();
                if (config.endpoints && config.endpoints.length > 0) {
                    this.endpoints = config.endpoints;
                    this.saveEndpointsToLocalStorage(); // Sync to localStorage
                    this.renderEndpoints();
                    this.updateEndpointCount();
                    this.logToConsole(`📂 Loaded ${config.endpoints.length} endpoints from backend`, 'success');
                } else {
                    // If server has no endpoints, sync local storage to server
                    if (this.endpoints.length > 0) {
                        this.logToConsole('📤 Syncing local endpoints to backend...', 'info');
                        await this.saveConfigToServer();
                    }
                }
            } else {
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (error) {
            this.logToConsole('⚠️ Could not connect to backend. Using demo data only.', 'warning');
            console.warn('Backend connection error:', error);
            
            // Show demo warning
            this.showDemoWarning();
        }
    }

    // Show demo warning when backend is not available
    showDemoWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4';
        warningDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <i class="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                <div>
                    <h4 class="font-semibold text-yellow-800 mb-1">Backend Unavailable</h4>
                    <p class="text-yellow-700 text-sm">
                        The backend API is not accessible. You can still explore the interface, but schema validation and testing features will not work.
                    </p>
                </div>
            </div>
        `;
        
        // Insert after the demo info card
        const demoCard = document.querySelector('.bg-blue-50');
        if (demoCard && demoCard.parentNode) {
            demoCard.parentNode.insertBefore(warningDiv, demoCard.nextSibling);
        }
    }

    // Save only to localStorage (separate from server sync)
    saveEndpointsToLocalStorage() {
        localStorage.setItem('schemaEndpoints', JSON.stringify(this.endpoints));
    }

    // Save configuration to server
    async saveConfigToServer() {
        try {
            const config = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                endpoints: this.endpoints
            };

            const response = await fetch(`${this.apiUrl}/api/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const result = await response.json();
                this.logToConsole('💾 Configuration saved to backend', 'success');
                console.log('Backend response:', result);
            } else {
                const errorText = await response.text();
                throw new Error(`Backend returned ${response.status}: ${errorText}`);
            }
        } catch (error) {
            this.logToConsole(`⚠️ Could not save to backend: ${error.message}`, 'warning');
            console.error('Save error:', error);
        }
    }

    // Load endpoints from localStorage with demo data
    loadEndpoints() {
        const stored = localStorage.getItem('schemaEndpoints');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Default demo endpoints
        return [
            { 
                name: 'petstore-v2', 
                url: 'https://petstore.swagger.io/v2/swagger.json', 
                schemaPath: 'petstore' 
            },
            { 
                name: 'jsonplaceholder', 
                url: 'https://jsonplaceholder.typicode.com/', 
                schemaPath: 'jsonplaceholder' 
            }
        ];
    }

    // Save endpoints to localStorage and server
    async saveEndpoints() {
        this.saveEndpointsToLocalStorage();
        await this.saveConfigToServer();
        this.updateEndpointCount();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Ensure DOM is ready before setting up event listeners
        const setupListeners = () => {
            // Add endpoint form
            const addForm = document.getElementById('addEndpointForm');
            if (addForm) {
                addForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addEndpoint();
                });
            }

            // Action buttons
            const validateBtn = document.getElementById('validateBtn');
            if (validateBtn) validateBtn.addEventListener('click', () => this.validateSchemas());

            const updateBtn = document.getElementById('updateBtn');
            if (updateBtn) updateBtn.addEventListener('click', () => this.updateSnapshots());

            const cleanupBtn = document.getElementById('cleanupBtn');
            if (cleanupBtn) cleanupBtn.addEventListener('click', () => this.cleanupSchemas());

            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) exportBtn.addEventListener('click', () => this.exportConfig());

            const importBtn = document.getElementById('importBtn');
            if (importBtn) importBtn.addEventListener('click', () => this.importConfig());

            const clearConsole = document.getElementById('clearConsole');
            if (clearConsole) clearConsole.addEventListener('click', () => this.clearConsole());

            // File input for import
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        };

        // Try to set up listeners now, or wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupListeners);
        } else {
            setupListeners();
        }
    }

    // Add new endpoint
    async addEndpoint() {
        const name = document.getElementById('endpointName').value.trim();
        const url = document.getElementById('endpointUrl').value.trim();
        const schemaPath = document.getElementById('schemaPath').value.trim();

        if (!name || !url || !schemaPath) {
            this.logToConsole('❌ Please fill in all fields', 'error');
            return;
        }

        // Check if endpoint name already exists
        if (this.endpoints.find(ep => ep.name === name)) {
            this.logToConsole(`❌ Endpoint with name "${name}" already exists`, 'error');
            return;
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            this.logToConsole('❌ Please enter a valid URL', 'error');
            return;
        }

        const endpoint = { name, url, schemaPath };
        this.endpoints.push(endpoint);
        await this.saveEndpoints();
        this.renderEndpoints();

        // Clear form
        document.getElementById('addEndpointForm').reset();
        this.logToConsole(`✅ Added endpoint: ${name}`, 'success');
    }

    // Remove endpoint and cleanup schema files
    async removeEndpoint(name) {
        this.logToConsole(`🗑️ Removing endpoint: ${name}...`, 'info');
        this.showLoading();

        try {
            // Call backend API to remove endpoint and cleanup schemas
            const response = await fetch(`${this.apiUrl}/endpoints/${encodeURIComponent(name)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                
                // Update local state
                this.endpoints = this.endpoints.filter(ep => ep.name !== name);
                this.saveEndpointsToLocalStorage();
                this.renderEndpoints();
                
                this.logToConsole(`✅ ${result.message}`, 'success');
                if (result.removedSchemaPath) {
                    this.logToConsole(`🗂️ Cleaned up schema directory: ${result.removedSchemaPath}`, 'info');
                }
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to remove endpoint');
            }
        } catch (error) {
            this.logToConsole(`❌ Failed to remove endpoint from backend: ${error.message}`, 'error');
            // Fallback to local removal only
            this.endpoints = this.endpoints.filter(ep => ep.name !== name);
            this.saveEndpointsToLocalStorage();
            this.renderEndpoints();
            this.logToConsole('⚠️ Endpoint removed from UI only. Backend may still have schema files.', 'warning');
        } finally {
            this.hideLoading();
        }
    }

    // Test endpoint connection
    async testEndpoint(endpoint) {
        this.logToConsole(`🔍 Testing connection to ${endpoint.name}...`, 'info');
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}/api/test-endpoint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: endpoint.url })
            });

            const result = await response.json();
            
            if (result.success) {
                this.logToConsole(`✅ ${endpoint.name} - Connection successful (Status: ${result.status})`, 'success');
            } else {
                this.logToConsole(`❌ ${endpoint.name} - Connection failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.logToConsole(`❌ ${endpoint.name} - Test failed: ${error.message}`, 'error');
            
            // For demo, try direct connection test
            if (this.isDemo) {
                this.logToConsole(`🔄 Attempting direct connection test...`, 'info');
                try {
                    // Simple fetch to test if URL is accessible (will likely fail due to CORS, but that's expected)
                    await fetch(endpoint.url, { mode: 'no-cors' });
                    this.logToConsole(`✅ ${endpoint.name} - URL appears to be valid (CORS prevented full test)`, 'success');
                } catch (directError) {
                    this.logToConsole(`❌ ${endpoint.name} - URL test failed: ${directError.message}`, 'error');
                }
            }
        } finally {
            this.hideLoading();
        }
    }

    // Validate schemas using backend API
    async validateSchemas() {
        if (this.endpoints.length === 0) {
            this.logToConsole('⚠️ No endpoints configured', 'warning');
            return;
        }

        this.logToConsole('🔍 Starting schema validation...', 'info');
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}/api/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ updateSnapshots: false })
            });

            const result = await response.json();
            
            if (result.success) {
                this.logToConsole('🎉 Schema validation completed successfully!', 'success');
                if (result.stdout) {
                    // Only show lines with summary or success, filter out noise
                    const lines = result.stdout.split('\n');
                    lines.forEach(line => {
                        if (/Loaded|matches snapshot|error|Error|failed|Failed|❌|✅|📋/i.test(line)) {
                            this.logToConsole(line, /error|Error|failed|Failed|❌/i.test(line) ? 'error' : 'info');
                        }
                    });
                }
            } else {
                this.logToConsole(`❌ Validation failed: ${result.error}`, 'error');
                if (result.stderr) {
                    this.logToConsole('📋 Error details:', 'error');
                    this.logToConsole(result.stderr, 'error');
                }
            }
        } catch (error) {
            this.logToConsole(`❌ Validation request failed: ${error.message}`, 'error');
            if (this.isDemo) {
                this.logToConsole('💡 Demo note: Schema validation requires a connected backend with Playwright setup', 'info');
            }
        } finally {
            this.hideLoading();
        }
    }

    // Update snapshots using backend API
    async updateSnapshots() {
        if (this.endpoints.length === 0) {
            this.logToConsole('⚠️ No endpoints configured', 'warning');
            return;
        }

        this.logToConsole('🔄 Starting snapshot update...', 'info');
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}/api/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ updateSnapshots: true })
            });

            const result = await response.json();
            
            if (result.success) {
                this.logToConsole('🎉 Snapshots updated successfully!', 'success');
                if (result.stdout) {
                    // Only show lines with summary or success, filter out noise
                    const lines = result.stdout.split('\n');
                    lines.forEach(line => {
                        if (/Loaded|matches snapshot|error|Error|failed|Failed|❌|✅|📋/i.test(line)) {
                            this.logToConsole(line, /error|Error|failed|Failed|❌/i.test(line) ? 'error' : 'info');
                        }
                    });
                }
            } else {
                this.logToConsole(`❌ Update failed: ${result.error}`, 'error');
                if (result.stderr) {
                    this.logToConsole('📋 Error details:', 'error');
                    this.logToConsole(result.stderr, 'error');
                }
            }
        } catch (error) {
            this.logToConsole(`❌ Update request failed: ${error.message}`, 'error');
            if (this.isDemo) {
                this.logToConsole('💡 Demo note: Snapshot updates require a connected backend with Playwright setup', 'info');
            }
        } finally {
            this.hideLoading();
        }
    }

    // Export configuration
    exportConfig() {
        const config = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: this.endpoints,
            exported_from: 'schema-validator-demo'
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema-validator-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.logToConsole('💾 Configuration exported successfully', 'success');
    }

    // Import configuration
    importConfig() {
        document.getElementById('fileInput').click();
    }

    // Handle file import
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                if (!config.endpoints || !Array.isArray(config.endpoints)) {
                    throw new Error('Invalid configuration format');
                }

                this.endpoints = config.endpoints;
                this.saveEndpoints();
                this.renderEndpoints();
                this.logToConsole(`📂 Imported ${config.endpoints.length} endpoints`, 'success');
            } catch (error) {
                this.logToConsole(`❌ Import failed: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    // Render endpoints list
    renderEndpoints() {
        const container = document.getElementById('endpointsList');
        if (!container) {
            // If container doesn't exist yet, skip rendering
            return;
        }
        
        if (this.endpoints.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p class="text-lg">No endpoints configured</p>
                    <p class="text-sm">Add your first Swagger endpoint above to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.endpoints.map(endpoint => `
            <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition duration-200">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-semibold text-gray-800">${this.escapeHtml(endpoint.name)}</h3>
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${this.escapeHtml(endpoint.schemaPath)}</span>
                        </div>
                        <p class="text-sm text-gray-600 break-all">${this.escapeHtml(endpoint.url)}</p>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <button onclick="window.app?.testEndpoint(${JSON.stringify(endpoint).replace(/\"/g, '&quot;')})" 
                                class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition duration-200">
                            <i class="fas fa-vial"></i> Test
                        </button>
                        <button onclick="window.app?.removeEndpoint('${endpoint.name}')" 
                                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition duration-200">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                        <button onclick="window.app?.openEditSchemaModal('${endpoint.name}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200">
                            <i class="fas fa-edit"></i> Edit Schema
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- Edit Schema Modal Logic ---
    async openEditSchemaModal(endpointName) {
        const endpoint = this.endpoints.find(ep => ep.name === endpointName);
        if (!endpoint) {
            this.logToConsole(`❌ Endpoint not found: ${endpointName}`, 'error');
            return;
        }
        this.showEditSchemaModal();
        document.getElementById('editSchemaEndpointName').textContent = endpointName;
        document.getElementById('editSchemaSaveBtn').onclick = () => this.saveEditedSchema(endpointName);
        document.getElementById('editSchemaError').textContent = '';
        document.getElementById('editSchemaTextarea').value = '';
        // Try to fetch schema from backend
        try {
            const res = await fetch(`${this.apiUrl}/api/schema/${encodeURIComponent(endpointName)}`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('editSchemaTextarea').value = JSON.stringify(data.schema, null, 2);
            } else {
                throw new Error('Not found');
            }
        } catch {
            // fallback: use local endpoint.schema if present
            document.getElementById('editSchemaTextarea').value = endpoint.schema ? JSON.stringify(endpoint.schema, null, 2) : '{\n  \n}';
        }
    }
    showEditSchemaModal() {
        document.getElementById('editSchemaModal').classList.remove('hidden');
    }
    hideEditSchemaModal() {
        document.getElementById('editSchemaModal').classList.add('hidden');
    }
    async saveEditedSchema(endpointName) {
        const textarea = document.getElementById('editSchemaTextarea');
        const errorDiv = document.getElementById('editSchemaError');
        let schema;
        try {
            schema = JSON.parse(textarea.value);
        } catch (e) {
            errorDiv.textContent = 'Invalid JSON: ' + e.message;
            return;
        }
        errorDiv.textContent = '';
        this.showLoading();
        try {
            const res = await fetch(`${this.apiUrl}/api/schema/${encodeURIComponent(endpointName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schema })
            });
            if (res.ok) {
                this.logToConsole(`✅ Schema updated for ${endpointName}`, 'success');
                // Optionally update local endpoint object
                const endpoint = this.endpoints.find(ep => ep.name === endpointName);
                if (endpoint) endpoint.schema = schema;
                this.hideEditSchemaModal();
            } else {
                const errorResult = await res.json();
                throw new Error(errorResult.error || 'Failed to save schema');
            }
        } catch (error) {
            this.logToConsole(`❌ Failed to save schema: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Add edit schema modal to DOM
    addEditSchemaModal() {
        const modalHtml = `
            <div id="editSchemaModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 hidden">
                <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
                    <h2 class="text-lg font-semibold mb-2">Edit Schema for <span id="editSchemaEndpointName"></span></h2>
                    <textarea id="editSchemaTextarea" class="w-full h-64 border rounded p-2 font-mono text-sm mb-2" spellcheck="false"></textarea>
                    <div id="editSchemaError" class="text-red-500 text-sm mb-2"></div>
                    <div class="flex justify-end space-x-2">
                        <button onclick="window.app?.hideEditSchemaModal()" class="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                        <button id="editSchemaSaveBtn" class="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Escape HTML for safe rendering
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Logging utility
    logToConsole(message, type = 'info') {
        const consoleEl = document.getElementById('consoleOutput');
        if (!consoleEl) {
            // If console element doesn't exist yet, just log to browser console
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        const messageEl = document.createElement('div');
        messageEl.className = `console-message console-${type}`;
        messageEl.innerHTML = message;
        consoleEl.appendChild(messageEl);
        consoleEl.scrollTop = consoleEl.scrollHeight; // Auto-scroll to bottom
    }

    // Clear console output
    clearConsole() {
        document.getElementById('consoleOutput').innerHTML = '';
    }

    // Show loading spinner
    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    // Hide loading spinner
    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    // Update endpoint count badge
    updateEndpointCount() {
        const countElement = document.getElementById('endpointCount');
        if (countElement) {
            countElement.textContent = this.endpoints.length;
        }
    }
}

// Initialize the app when DOM is ready
function initializeApp() {
    const app = new SchemaValidatorApp();
    
    // Expose app globally for onclick handlers - set immediately
    window.app = app;
    globalThis.app = app;
    
    // Also expose on global object for bundlers
    if (typeof global !== 'undefined') {
        global.app = app;
    }
    
    return app;
}

// Expose app creation function globally as backup
window.initializeApp = initializeApp;

// Initialize based on document ready state
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = initializeApp();
    });
} else {
    app = initializeApp();
}

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
