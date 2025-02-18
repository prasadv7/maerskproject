// Form Handler for Tax Collected Details
document.addEventListener("DOMContentLoaded", () => {
    const detailsForm = document.getElementById('details-form');
    let selectedEntityData = null; // Store full entity data

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

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`http://localhost:5000${url}`, options);
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

    // Display Fiscal Records in middle panel
    function displayFiscalRecords(records) {
        const fiscalRecordsList = document.getElementById('fiscal-records-list');
        if (!fiscalRecordsList) return;

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
                    <span class="fiscal-period">${record.fiscal_Period}</span>
                </div>
                <div class="fiscal-record-body">
                    <span class="state-province">${record.state_Province || 'N/A'}</span>
                </div>
            `;
            fiscalRecordsList.appendChild(recordElement);
        });
    }

    // Get entity details when selected
    async function updateSelectedEntity(entityId) {
        try {
            const response = await callApi(`/api/Entity/${entityId}`);
            if (response.ok) {
                selectedEntityData = await response.json();
            }
        } catch (error) {
            console.error('Error fetching entity details:', error);
        }
    }

    // Handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const entityId = window.selectedEntity;
        if (!entityId) {
            alert('Please select an entity first');
            return;
        }

        // Ensure we have the latest entity data
        await updateSelectedEntity(entityId);
        if (!selectedEntityData) {
            alert('Failed to get entity details. Please try again.');
            return;
        }

        const formData = new FormData(event.target);
        const data = {
            entityID: entityId,
            legal_Entity_Name: selectedEntityData.legal_Entity_Name,
            company_Code: selectedEntityData.company_Code,
            tax_Reporting_Country: selectedEntityData.tax_Reporting_Country,
            hfm_Code: selectedEntityData.hfm_Code,
            fiscal_Period: formData.get('fiscal_Period'),
            state_Province: formData.get('state_Province'),
            erp: formData.get('erp'),
            currency: formData.get('currency'),
            net_VAT_Receivable: parseFloat(formData.get('net_VAT_Receivable')) || 0,
            net_VAT_Payable: parseFloat(formData.get('net_VAT_Payable')) || 0,
            comments: formData.get('comments'),
            date: new Date().toISOString(),
            updatecheck: false
        };

        try {
            const response = await callApi('/api/TaxCollectedDetails', 'POST', data);
            if (response.ok) {
                alert('Details saved successfully');
                // Refresh the fiscal records display
                loadFiscalRecords(entityId);
                // Reset form but keep the entity details
                const entityName = document.getElementById('legal-entity-name').value;
                const hfmCode = document.getElementById('hfm-code').value;
                event.target.reset();
                document.getElementById('legal-entity-name').value = entityName;
                document.getElementById('hfm-code').value = hfmCode;
            } else {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                alert('Failed to save details. Please check the console for more information.');
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

    // Listen for entity selection changes
    window.addEventListener('entitySelected', async (event) => {
        const entityId = window.selectedEntity;
        if (entityId) {
            await updateSelectedEntity(entityId);
        }
    });
});
