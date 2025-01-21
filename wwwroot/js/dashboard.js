document.addEventListener("DOMContentLoaded", () => {
    const jwtToken = localStorage.getItem("jwtToken"); // Use consistent key name
    
    // Debug: Log token information
    if (jwtToken) {
        try {
            const debugPayload = JSON.parse(atob(jwtToken.split(".")[1]));
            console.log('JWT Token payload:', debugPayload);
        } catch (error) {
            console.error('Error parsing token for debug:', error);
        }
    } else {
        console.log('No token found in localStorage');
        window.location.href = 'login.html'; // Redirect to login if no token
        return;
    }
    
    // Only check for JWT token if we're on a protected page
    if (document.getElementById("username")) {
        if (!jwtToken) {
            alert("Access denied. Please log in first.");
            window.location.href = "index.html";
            return;
        }

        // JWT token related code for protected pages
        const usernameElement = document.getElementById("username");
        const contentSection = document.getElementById("content-section");
        const logoutLink = document.getElementById("logout-link");

        if (usernameElement && jwtToken) {
            const payload = JSON.parse(atob(jwtToken.split(".")[1]));
            usernameElement.textContent = payload.name || "User";
        }

        // Protected page event listeners
        if (document.getElementById("user-info-link")) {
            document.getElementById("user-info-link").addEventListener("click", () => {
                contentSection.innerHTML = `<h2>Your Information</h2><p>Email: ${payload.email}</p>`;
            });
        }

        if (logoutLink) {
            logoutLink.addEventListener("click", () => {
                localStorage.removeItem("jwtToken"); // Use consistent key name
                window.location.href = "login.html";
            });
        }
    }

    // Dashboard specific functionality
    const detailsContent = document.getElementById("details-content");
    const arrowButtons = document.querySelectorAll(".arrow-button");

    console.log("Details content found:", !!detailsContent);
    console.log("Number of arrow buttons found:", arrowButtons.length);

    const showLoading = () => {
        if (detailsContent) {
            detailsContent.innerHTML = '<h3>Getting your data...</h3>';
        }
    };

    // Helper function for API calls
    const callApi = async (url, method = 'GET', body = null) => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('Your session has expired. Please log in again.');
            window.location.href = 'login.html';
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

        const response = await fetch(url, options);
        
        if (response.status === 401) {
            // Handle unauthorized / expired token
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
            return;
        }

        return response;
    };

    // Function to handle form submission
    const handleFormSubmit = async () => {
        try {
            // Get the selected entity ID
            const selectedButton = document.querySelector('.arrow-button[data-selected="true"]');
            if (!selectedButton) {
                alert('Please select an entity first');
                return;
            }
            const entityId = selectedButton.getAttribute('data-entity-id');

            // Get user ID from JWT token
            const token = localStorage.getItem("jwtToken");
            if (!token) {
                alert('Your session has expired. Please log in again.');
                window.location.href = 'login.html';
                return;
            }

            let userId;
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                // Try different possible claim names for user ID
                userId = payload.sub || payload.nameid || payload.uid || payload.id || '1';
                console.log('Token payload:', payload); // For debugging
            } catch (error) {
                console.error('Error parsing token:', error);
                userId = '1'; // Fallback user ID
            }

            const now = new Date().toISOString();

            const formData = {
                Company_Code: entityId === '1' ? 'DEGA' : 'ABCD',
                Legal_Entity_Name: document.getElementById("legal-entity").value,
                Tax_Reporting_Country: entityId === '1' ? 'Denmark' : 'USA',
                HFM_Code: document.getElementById("hfm-code").value,
                Fiscal_Period: document.getElementById("fiscal-period").value,
                State_Province: document.getElementById("state").value,
                Net_VAT_Receivable: parseFloat(document.getElementById("vat-receivable").value) || 0,
                Net_VAT_Payable: parseFloat(document.getElementById("vat-payable").value) || 0,
                Comments: document.getElementById("comments").value,
                Date: now,
                ERP: "SAP",
                Currency: "USD",
                Updatecheck: false,
                Created: now,
                Modified: now,
                Created_By: userId.toString(),
                Modified_By: userId.toString()
            };

            const response = await callApi('/api/TaxCollectedDetails', 'POST', formData);

            if (response.ok) {
                const result = await response.json();
                alert('Data saved successfully!');
                console.log('Saved data:', result);
            } else {
                const errorData = await response.json();
                let errorMessage = 'Failed to save data:\n';
                if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(key => {
                        errorMessage += `${key}: ${errorData.errors[key].join(', ')}\n`;
                    });
                } else {
                    errorMessage += errorData.title || 'Unknown error occurred';
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data. Please try again.');
        }
    };

    const renderInputFields = (entityId) => {
        console.log("Rendering input fields for Entity ID:", entityId);

        setTimeout(() => {
            detailsContent.innerHTML = `
                <div class="form-row">
                    <label for="legal-entity">Legal Entity Name:</label>
                    <input type="text" id="legal-entity" name="legal-entity" value="${entityId === '1' ? 'Maersk A/S' : 'Example Corp'}">
                    <label for="hfm-code">HFM Code:</label>
                    <input type="text" id="hfm-code" name="hfm-code" value="${entityId === '1' ? 'DK846U' : 'XY1234'}">
                </div>
                <div class="form-row">
                    <label for="fiscal-period">* Fiscal Period:</label>
                    <select id="fiscal-period" name="fiscal-period">
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                    </select>
                    <label for="state">State/Province:</label>
                    <input type="text" id="state" name="state" placeholder="Enter state">
                </div>
                <div class="form-row">
                    <label for="vat-receivable">Net VAT Receivable:</label>
                    <input type="number" id="vat-receivable" name="vat-receivable" placeholder="0.00">
                    <label for="vat-payable">Net VAT Payable:</label>
                    <input type="number" id="vat-payable" name="vat-payable" placeholder="0.00">
                </div>
                <div class="form-row">
                    <label for="comments">Comments:</label>
                    <textarea id="comments" name="comments" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <button type="button" class="save-button">Save</button>
                </div>
            `;

            // Add event listener to save button
            const saveButton = detailsContent.querySelector('.save-button');
            if (saveButton) {
                saveButton.addEventListener('click', handleFormSubmit);
            }

            console.log("Input fields rendered successfully");
        }, 1500);
    };

    // Add event listeners to arrow buttons
    arrowButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            // Remove selected state from all buttons
            arrowButtons.forEach(btn => btn.removeAttribute('data-selected'));
            
            const entityId = e.target.getAttribute('data-entity-id');
            // Mark this button as selected
            e.target.setAttribute('data-selected', 'true');
            
            console.log("Arrow button clicked! Entity ID:", entityId);

            if (!entityId) {
                console.error("No entity ID found for the clicked button");
                alert("Please select a valid entity");
                return;
            }

            showLoading();
            renderInputFields(entityId);
        });
    });
});