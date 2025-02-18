// Dropdown Handler for Form Options
document.addEventListener("DOMContentLoaded", () => {
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

    // Initialize dropdowns
    loadDropdownOptions();
});
