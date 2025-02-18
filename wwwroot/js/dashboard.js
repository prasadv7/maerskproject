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
            console.log('Entity API Response:', response);
            if (response.ok) {
                const entities = await response.json();
                console.log('Entities loaded:', entities);
                displayEntities(entities);
            } else {
                console.error('Failed to load entities:', await response.text());
            }
        } catch (error) {
            console.error('Error loading entities:', error);
        }
    }

    // Display Entities in the Panel
    function displayEntities(entities = []) {
        console.log('Displaying entities:', entities);
        entityList.innerHTML = '';
        
        if (entities.length === 0) {
            const noEntitiesMessage = document.createElement('div');
            noEntitiesMessage.className = 'no-entities-message';
            noEntitiesMessage.innerHTML = `
                <p>No entities available.</p>
            `;
            entityList.appendChild(noEntitiesMessage);
            return;
        }
        
        entities.forEach(entity => {
            const entityBlock = document.createElement('div');
            entityBlock.className = 'entity-block';
            
            const companyInfo = `<strong>CC:</strong> ${entity.company_Code || entity.Company_Code} | <strong>HFM Code:</strong> ${entity.hfm_Code || entity.HFM_Code}`;
            const entityName = entity.legal_Entity_Name || entity.Legal_Entity_Name;
            const country = entity.tax_Reporting_Country || entity.Tax_Reporting_Country;
            
            entityBlock.innerHTML = `
                <div class="entity-details">
                    <p>${companyInfo}</p>
                    <p>${entityName}</p>
                    <p>${country}</p>
                </div>
                <div class="entity-arrow">
                    <button class="arrow-button" data-entity-id="${entity.ID || entity.id}" title="View Details">→</button>
                </div>
            `;
            
            entityBlock.addEventListener('click', () => {
                document.querySelectorAll('.entity-block').forEach(block =>
                    block.classList.remove('selected'));
                
                entityBlock.classList.add('selected');
                window.selectedEntity = entity.ID || entity.id;
                loadFiscalRecords(window.selectedEntity);
                displayEntityDetails(entity);
            });
            
            const arrowButton = entityBlock.querySelector('.arrow-button');
            arrowButton.addEventListener('click', () => {
                document.querySelectorAll('.entity-block').forEach(block =>
                    block.classList.remove('selected'));
                
                entityBlock.classList.add('selected');
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
            const response = await callApi(`/api/TaxCollectedDetails/${entityId}`);
            if (response.ok) {
                const records = await response.json();
                displayFiscalRecords(records);
            }
        } catch (error) {
            console.error('Error loading fiscal records:', error);
        }
    }

    // Display Fiscal Records
    function displayFiscalRecords(records) {
        const fiscalRecordsList = document.getElementById('fiscal-records-list');
        fiscalRecordsList.innerHTML = '';
        
        if (!records || records.length === 0) {
            fiscalRecordsList.innerHTML = '<div class="no-records">No records found</div>';
            return;
        }
        
        records.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.className = 'fiscal-record';
            recordElement.innerHTML = `
                <div class="fiscal-record-header">
                    <span class="fiscal-period">${record.fiscal_Period || record.Fiscal_Period}</span>
                </div>
                <div class="fiscal-record-body">
                    <span class="state-province">${record.state_Province || record.State_Province || 'N/A'}</span>
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
        const data = {
            entityID: window.selectedEntity,
            legal_Entity_Name: formData.get('legal_Entity_Name'),
            hfm_Code: formData.get('hfm_Code'),
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
                const entityName = document.getElementById('legal-entity-name').value;
                const hfmCode = document.getElementById('hfm-code').value;
                event.target.reset();
                document.getElementById('legal-entity-name').value = entityName;
                document.getElementById('hfm-code').value = hfmCode;
            } else {
                const error = await response.text();
                alert('Failed to save details: ' + error);
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