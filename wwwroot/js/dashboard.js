document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const entityList = document.getElementById('entity-list');
    const fiscalRecordsList = document.getElementById('fiscal-records-list');
    const detailsForm = document.getElementById('details-form');

    // State Management
    window.selectedEntity = null;

    // Helper function for API calls
    async function callApi(url, method = 'GET', body = null) {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            const response = await fetch(`http://localhost:5000${url}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }
            return response;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Load Entities from Database
    async function loadEntities() {
        try {
            const response = await callApi('/api/Entity');
            console.log('API Response Status:', response.status);
            console.log('API Response Headers:', response.headers);
            
            if (!response || !response.ok) {
                console.error('API Error:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error Details:', errorText);
                return;
            }

            const responseText = await response.text();
            console.log('Raw Response:', responseText);

            if (!responseText) {
                console.error('Empty response received');
                return;
            }

            const entities = JSON.parse(responseText);
            console.log('Parsed Entities:', entities);

            if (Array.isArray(entities)) {
                displayEntities(entities);
            } else {
                console.error('Invalid response format - expected array');
                displayEntities([]);
            }
        } catch (error) {
            console.error('Error loading entities:', error);
            displayEntities([]);
        }
    }

    // Display Entities in the Panel
    function displayEntities(entities = []) {
        entityList.innerHTML = '';
        
        if (entities.length === 0) {
            entityList.innerHTML = `
                <div class="no-entities-message">
                    <p>No entities available.</p>
                </div>`;
            return;
        }
        
        entities.forEach(entity => {
            if (!entity) return;
            
            const entityBlock = document.createElement('div');
            entityBlock.className = 'entity-block';
            
            // Ensure we have values even if properties are missing
            const companyCode = entity.Company_Code || entity.company_Code || 'N/A';
            const hfmCode = entity.HFM_Code || entity.hfm_Code || 'N/A';
            const entityName = entity.Legal_Entity_Name || entity.legal_Entity_Name || 'N/A';
            const country = entity.Tax_Reporting_Country || entity.tax_Reporting_Country || 'N/A';
            
            entityBlock.innerHTML = `
                <div class="entity-details">
                    <p><strong>CC:</strong> ${companyCode} | <strong>HFM Code:</strong> ${hfmCode}</p>
                    <p>${entityName}</p>
                    <p>${country}</p>
                </div>
                <div class="entity-arrow">
                    <button class="arrow-button" data-entity-id="${entity.ID || entity.id}" title="View Details">→</button>
                </div>
            `;
            
            entityBlock.addEventListener('click', () => {
                // Remove selection from all blocks
                document.querySelectorAll('.entity-block').forEach(block => 
                    block.classList.remove('selected'));
                
                // Add selection to clicked block
                entityBlock.classList.add('selected');
                
                // Store selected entity and load its details
                window.selectedEntity = entity.ID || entity.id;
                loadFiscalRecords(window.selectedEntity);
                displayEntityDetails(entity);
            });
            
            entityList.appendChild(entityBlock);
        });
    }

    // Display entity details in form
    function displayEntityDetails(entity) {
        const detailsForm = document.getElementById('details-form');
        const noSelectionMessage = document.getElementById('no-selection-message');
        
        if (!detailsForm) {
            console.error('Details form not found');
            return;
        }

        detailsForm.style.display = 'block';
        if (noSelectionMessage) {
            noSelectionMessage.style.display = 'none';
        }

        document.getElementById('legal-entity-name').value = entity.legal_Entity_Name || entity.Legal_Entity_Name;
        document.getElementById('hfm-code').value = entity.hfm_Code || entity.HFM_Code;

        document.getElementById('fiscal-period').value = '';
        document.getElementById('state-province').value = '';
        document.getElementById('erp').value = '';
        document.getElementById('currency').value = '';
        document.getElementById('net-vat-receivable').value = '';
        document.getElementById('net-vat-payable').value = '';
        document.getElementById('comments').value = '';
    }

    // Load dropdown options
    async function loadDropdownOptions() {
        try {
            const response = await fetch('/input-options.json');
            const options = await response.json();
            
            // Populate Fiscal Period dropdown
            const fiscalPeriodSelect = document.getElementById('fiscal-period');
            if (fiscalPeriodSelect) {
                options.fiscalPeriods.forEach(period => {
                    const option = document.createElement('option');
                    option.value = period;
                    option.textContent = period;
                    fiscalPeriodSelect.appendChild(option);
                });
            }

            // Populate ERP dropdown
            const erpSelect = document.getElementById('erp');
            if (erpSelect) {
                options.erp.forEach(erp => {
                    const option = document.createElement('option');
                    option.value = erp;
                    option.textContent = erp;
                    erpSelect.appendChild(option);
                });
            }

            // Populate Currency dropdown
            const currencySelect = document.getElementById('currency');
            if (currencySelect) {
                options.currencies.forEach(currency => {
                    const option = document.createElement('option');
                    option.value = currency.split(' - ')[0];
                    option.textContent = currency;
                    currencySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading dropdown options:', error);
        }
    }

    // Load Fiscal Records
    async function loadFiscalRecords(entityId) {
        try {
            console.log('Loading fiscal records for entity:', entityId);
            const response = await callApi(`/api/TaxCollectedDetails/${entityId}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error loading fiscal records:', errorText);
                displayFiscalRecords([]);
                return;
            }

            const responseText = await response.text();
            console.log('Fiscal records response:', responseText);

            if (!responseText) {
                console.log('No fiscal records found');
                displayFiscalRecords([]);
                return;
            }

            const records = JSON.parse(responseText);
            console.log('Parsed fiscal records:', records);
            displayFiscalRecords(records);
        } catch (error) {
            console.error('Error loading fiscal records:', error);
            displayFiscalRecords([]);
        }
    }

    // Display Fiscal Records
    function displayFiscalRecords(records) {
        const fiscalRecordsList = document.getElementById('fiscal-records-list');
        if (!fiscalRecordsList) {
            console.error('Fiscal records list element not found');
            return;
        }

        fiscalRecordsList.innerHTML = '';
        
        if (!records || records.length === 0) {
            fiscalRecordsList.innerHTML = '<div class="no-records">No records found</div>';
            return;
        }
        
        // Sort records by creation date (newest first)
        records.sort((a, b) => {
            const dateA = new Date(a.Created || a.created);
            const dateB = new Date(b.Created || b.created);
            return dateB - dateA;
        });
        
        records.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.className = 'fiscal-record';
            
            const fiscalPeriod = record.fiscal_Period || record.Fiscal_Period || 'N/A';
            const stateProvince = record.state_Province || record.State_Province || 'N/A';
            const netVatReceivable = record.net_VAT_Receivable || record.Net_VAT_Receivable || 0;
            const netVatPayable = record.net_VAT_Payable || record.Net_VAT_Payable || 0;
            const currency = record.currency || record.Currency || '';
            const erp = record.erp || record.ERP || 'N/A';
            const comments = record.comments || record.Comments || '';
            
            recordElement.innerHTML = `
                <div class="fiscal-record-header">
                    <span class="fiscal-period">${fiscalPeriod}</span>
                </div>
                <div class="fiscal-record-body">
                    <div class="record-detail">
                        <span class="label">State/Province:</span>
                        <span class="value">${stateProvince}</span>
                    </div>
                    <div class="record-detail">
                        <span class="label">ERP System:</span>
                        <span class="value">${erp}</span>
                    </div>
                    <div class="record-detail">
                        <span class="label">Net VAT Receivable:</span>
                        <span class="value">${currency} ${netVatReceivable.toFixed(2)}</span>
                    </div>
                    <div class="record-detail">
                        <span class="label">Net VAT Payable:</span>
                        <span class="value">${currency} ${netVatPayable.toFixed(2)}</span>
                    </div>
                    ${comments ? `
                    <div class="record-detail">
                        <span class="label">Comments:</span>
                        <span class="value">${comments}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            fiscalRecordsList.appendChild(recordElement);
        });
    }

    // Handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        if (!window.selectedEntity) {
            alert('Please select an entity first');
            return;
        }

        const formData = new FormData(event.target);
        const entityName = formData.get('legal_Entity_Name');
        const hfmCode = formData.get('hfm_Code');

        // Get the selected entity details from the form
        const selectedEntityElement = document.querySelector('.entity-block.selected');
        if (!selectedEntityElement) {
            alert('Please select an entity first');
            return;
        }

        // Extract company code and tax reporting country from the selected entity
        const companyCode = selectedEntityElement.querySelector('p:first-child').textContent.split('|')[0].replace('CC:', '').trim();
        const taxReportingCountry = selectedEntityElement.querySelector('p:last-child').textContent.trim();

        const data = {
            entityID: window.selectedEntity,
            company_Code: companyCode,
            legal_Entity_Name: entityName,
            tax_Reporting_Country: taxReportingCountry,
            hfm_Code: hfmCode,
            fiscal_Period: formData.get('fiscal_Period'),
            state_Province: formData.get('state_Province'),
            erp: formData.get('erp'),
            currency: formData.get('currency'),
            net_VAT_Receivable: parseFloat(formData.get('net_VAT_Receivable')) || 0,
            net_VAT_Payable: parseFloat(formData.get('net_VAT_Payable')) || 0,
            comments: formData.get('comments')
        };

        try {
            const response = await callApi('/api/TaxCollectedDetails', 'POST', data);
            if (response.ok) {
                alert('Details saved successfully');
                // Refresh the fiscal records display
                loadFiscalRecords(window.selectedEntity);
                // Reset form but keep the entity details
                event.target.reset();
                document.getElementById('legal-entity-name').value = entityName;
                document.getElementById('hfm-code').value = hfmCode;
            } else {
                const errorResponse = await response.json();
                const errorMessages = Object.values(errorResponse).flat().join('\n');
                alert('Failed to save details:\n' + errorMessages);
            }
        } catch (error) {
            console.error('Error saving details:', error);
            alert('Failed to save details. Please try again.');
        }
    }

    // Add form submit event listener
    if (detailsForm) {
        detailsForm.addEventListener('submit', handleFormSubmit);
    }

    // Initialize
    loadEntities();
    loadDropdownOptions();
});