document.getElementById('addEndpoints').addEventListener('click', function () {
    const urlString = document.getElementById('urls').value;
    const urlArray = urlString.split('\n').map(url => url.trim()).filter(url => url);
    const endpointsContainer = document.getElementById('endpointsContainer');

    urlArray.forEach((url, index) => {
        const urlId = url.replace(/[^a-zA-Z0-9]/g, '_'); // Crea un id univoco per l'URL
        if (!document.getElementById(`endpoint_${urlId}`)) { // Controlla se il div esiste già
            const div = document.createElement('div');
            div.className = 'endpoint-config';
            div.id = `endpoint_${urlId}`; // Assegna un id univoco al div
            div.innerHTML = `
                <h3>Endpoint ${index + 1}</h3>
                <p><strong>URL:</strong> ${url}</p>

                <label for="requestSchemaName${index}">Request Schema Name:</label><br>
                <input type="text" id="requestSchemaName${index}" class="request-schema-name"> <br><br>

                <div class="drag-and-drop-container">
                    <label for="requestSchemaResource${index}">Request Schema Resource:</label><br>
                    <textarea id="requestSchemaResource${index}" class="request-schema-resource"></textarea><br><br>
                    <div id="drop_zone_request_${index}" class="drop-zone">Drag & drop request schema JSON here</div>
                </div><br><br>

                <label for="responseSchemaName${index}">Response Schema Name:</label><br>
                <input type="text" id="responseSchemaName${index}" class="response-schema-name"><br><br>

                <div class="drag-and-drop-container">
                    <label for="responseSchemaResource${index}">Response Schema Resource:</label><br>
                    <textarea id="responseSchemaResource${index}" class="response-schema-resource"></textarea><br><br>
                    <div id="drop_zone_response_${index}" class="drop-zone">Drag & drop response schema JSON here</div>
                </div><br>

                <label>Security Schemes:</label>
                <input type="checkbox" id="BasicAuth${index}" class="security-scheme" value="BasicAuth"> BasicAuth <br>
                <input type="checkbox" id="BearerAuth${index}" class="security-scheme" value="BearerAuth"> BearerAuth <br>
                <input type="checkbox" id="ApiKeyAuth${index}" class="security-scheme" value="ApiKeyAuth"> ApiKeyAuth <br>
                <input type="checkbox" id="OpenID${index}" class="security-scheme" value="OpenID"> OpenID <br>
                <input type="checkbox" id="OAuth2${index}" class="security-scheme" value="OAuth2"> OAuth2 <br>
            `;
            endpointsContainer.appendChild(div);

            // Aggiungi gli event listeners per il drag-and-drop
            addDragAndDropListeners(`drop_zone_request_${index}`, `requestSchemaResource${index}`);
            addDragAndDropListeners(`drop_zone_response_${index}`, `responseSchemaResource${index}`);
        }
    });
});

document.getElementById('urlForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const serverUrl = document.getElementById('serverPath').value.trim();
    const urlString = document.getElementById('urls').value;
    const urlArray = urlString.split('\n').map(url => url.trim()).filter(url => url);
    const endpointsContainer = document.getElementById('endpointsContainer');
    const endpointsConfig = Array.from(endpointsContainer.querySelectorAll('.endpoint-config')).map(endpointConfig => ({
        requestSchemaName: endpointConfig.querySelector('.request-schema-name').value.trim(),
        requestSchemaResource: endpointConfig.querySelector('.request-schema-resource').value,
        responseSchemaName: endpointConfig.querySelector('.response-schema-name').value.trim(),
        responseSchemaResource: endpointConfig.querySelector('.response-schema-resource').value,
        securitySchemes: Array.from(endpointConfig.querySelectorAll('.security-scheme:checked')).map(checkbox => checkbox.value)
    }));
    document.getElementById('outputContainer').style.display = 'block';

    try {
        const response = await fetch('/api/swagger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urlArray, endpointsConfig, serverUrl }),
        });
        const swagger = await response.json();
        document.getElementById('output').textContent = JSON.stringify(swagger, null, 2);
    } catch (error) {
        console.error('Error generating Swagger document:', error);
        alert('Failed to generate Swagger document');
    }
});

// Evento di clic per il pulsante di copia
document.getElementById('copyBtn').addEventListener('click', function () {
    const outputText = document.getElementById('output').textContent;
    navigator.clipboard.writeText(outputText).then(() => {
        alert('Output copiato negli appunti!');
    }).catch(err => {
        console.error('Errore durante la copia del testo: ', err);
    });
});

function addDragAndDropListeners(dropZoneId, textareaId) {
    const dropZone = document.getElementById(dropZoneId);
    const textarea = document.getElementById(textareaId);

    dropZone.addEventListener('dragover', function (event) {
        event.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function () {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function (event) {
        event.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = event.dataTransfer.files;
        if (files.length) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const json = JSON.parse(e.target.result);
                    textarea.value = JSON.stringify(json, null, 2);
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        }
    });
}
