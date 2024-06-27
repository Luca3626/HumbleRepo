function generateSwagger(urlArray, endpointsConfig, serverUrl) {
    const swaggerDefinition = {
        openapi: '3.0.3',
        info: {
            title: 'API Test',
            version: '1.0.11',
        },
        servers: [{
            url: serverUrl
        }],
    };

    const components = {
        schemas: {},
        securitySchemes: {}
    };

    const paths = {};

    function extractHttpMethodAndUrl(inputString) {
        const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        const method = httpMethods.find(method => inputString.startsWith(method));
        if (!method) {
            throw new Error('Invalid HTTP method in input string.');
        }
        const path = inputString.substring(method.length).trim();
        const parameterInPath = [];
        const paramNameMatches = path.match(/{(\w+)}/g);
        if (paramNameMatches) {
            paramNameMatches.forEach(paramMatch => {
                const paramName = paramMatch.substring(1, paramMatch.length - 1);
                parameterInPath.push({
                    name: paramName,
                    in: 'path',
                    description: `The ${paramName} parameter`,
                    required: true,
                    schema: {
                        type: 'integer',
                        format: 'int64'
                    }
                });
            });
        }
        const parameterInQuery = [];
        const queryString = path.split('?')[1];
        if (queryString) {
            const queryParams = queryString.split('&');
            queryParams.forEach(queryParam => {
                const [paramName, paramValue] = queryParam.split('=');
                parameterInQuery.push({
                    name: paramName,
                    in: 'query',
                    description: `The ${paramName} parameter`,
                    required: false,
                    schema: {
                        type: 'string',
                        example: paramValue
                    }
                });
            });
        }
        return { method, path: path.split('?')[0], parameters: [...parameterInPath, ...parameterInQuery] };
    }

    function endpointGenerator(serverUrl, method, path, parameters, requestSchemaName, requestSchemaResource, responseSchemaName, responseSchemaResource, securitySchemes) {
        const requestBody = requestSchemaName ? {
            description: 'Request body',
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: `#/components/schemas/${requestSchemaName}` }
                }
            }
        } : undefined;

        let responses;
        if (responseSchemaName) {
            switch (method.toLowerCase()) {
                case 'get':
                    responses = {
                        '200': {
                            description: 'Success',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${responseSchemaName}` }
                                }
                            }
                        },
                        '400': { description: 'Bad Request' },
                        '404': { description: 'Resource not found' }
                    };
                    break;
                case 'post':
                    responses = {
                        '201': {
                            description: 'Resource created successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${responseSchemaName}` }
                                }
                            }
                        },
                        '400': { description: 'Bad Request' }
                    };
                    break;
                case 'put':
                    responses = {
                        '200': {
                            description: 'Resource updated successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${responseSchemaName}` }
                                }
                            }
                        },
                        '404': { description: 'Resource not found' }
                    };
                    break;
                case 'delete':
                    responses = {
                        '204': { description: 'Resource deleted successfully' },
                        '404': { description: 'Resource not found' }
                    };
                    break;
                case 'patch':
                    responses = {
                        '200': {
                            description: 'Resource modified successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${responseSchemaName}` }
                                }
                            }
                        },
                        '400': { description: 'Bad request' }
                    };
                    break;
                default:
                    responses = {
                        '200': {description: 'Success' },
                        '400': {description: 'Bad request' }
                    };
                    break;
            }
        } else {
            switch (method.toLowerCase()) {
                case 'get':
                    responses = {
                        '200': { description: 'Success' },
                        '400': { description: 'Bad Request' },
                        '404': { description: 'Resource not found' }
                    };
                    break;
                case 'post':
                    responses = {
                        '201': { description: 'Resource created successfully' },
                        '400': { description: 'Bad Request' }
                    };
                    break;
                case 'put':
                    responses = {
                        '200': { description: 'Resource updated successfully' },
                        '404': { description: 'Resource not found' }
                    };
                    break;
                case 'delete':
                    responses = {
                        '204': { description: 'Resource deleted successfully' },
                        '404': { description: 'Resource not found' }
                    };
                    break;
                case 'patch':
                    responses = {
                        '200': { description: 'Resource modified successfully' },
                        '400': { description: 'Bad request' }
                    };
                    break;
                default:
                    responses = {
                        '200': { description: 'Success' },
                        '400': { description: 'Bad request' }
                    };
                    break;
            }
        }

        try {
            if (requestSchemaName) {
                components.schemas[requestSchemaName] = convert(JSON.parse(requestSchemaResource));
            }
        } catch (error) {
            console.error(`Errore durante il parsing o la conversione del request schema per ${requestSchemaName}:`, error);
            alert(`Errore durante il parsing o la conversione del request schema per ${requestSchemaName}. Verifica che il JSON sia corretto.`);
        }

        try {
            if (responseSchemaName) {
                components.schemas[responseSchemaName] = convert(JSON.parse(responseSchemaResource));
            }
        } catch (error) {
            console.error(`Errore durante il parsing o la conversione del response schema per ${responseSchemaName}:`, error);
            alert(`Errore durante il parsing o la conversione del response schema per ${responseSchemaName}. Verifica che il JSON sia corretto.`);
        }

        /* Questa riga di codice è responsabile della configurazione delle informazioni di sicurezza per l'endpoint. 
        securitySchemes.length: Controlla se l'array securitySchemes contiene elementi. Se contiene uno o più schemi 
        di sicurezza, il valore sarà true; altrimenti sarà false.
        securitySchemes.map(scheme => ({ [scheme]: [] })): Se securitySchemes.length è true, questo map trasforma ogni 
        schema di sicurezza in un oggetto. La funzione di mappatura crea un nuovo array di oggetti, dove ciascun oggetto 
        ha una chiave che è il nome dello schema di sicurezza (scheme) e un valore che è un array vuoto ([]).
        Per esempio, se securitySchemes fosse ['BasicAuth', 'BearerAuth'], il risultato del map sarebbe [{ BasicAuth: [] }, 
        { BearerAuth: [] }].
        undefined: Se securitySchemes.length è false (cioè, l'array securitySchemes è vuoto), allora security sarà impostato 
        su undefined.
        Quindi, in pratica, questa riga di codice assegna a security un array di schemi di sicurezza se ci sono schemi 
        definiti, altrimenti assegna undefined. */
        const security = securitySchemes.length ? securitySchemes.map(scheme => ({ [scheme]: [] })) : undefined;

        const tags = path.split('/')[1];

        const endpoint = {
            [method.toLowerCase()]: {
                tags: [tags],
                summary: `${method} ${path}`,
                description: `Generated endpoint for ${method} ${path}`,
                operationId: `${method.toLowerCase()}${path.split('/').join('')}`,
                parameters: parameters.length ? parameters : undefined,
                requestBody,
                responses,
                security
            }
        };

        if (!paths[path]) {
            paths[path] = {};
        }

        paths[path] = {
            ...paths[path],
            ...endpoint
        };

        return paths;
    }

    endpointsConfig.forEach((endpointConfig, index) => {
        const url = urlArray[index];
        const { method, path, parameters } = extractHttpMethodAndUrl(url);
        const requestSchemaName = endpointConfig.requestSchemaName;
        const requestSchemaResource = endpointConfig.requestSchemaResource;
        const responseSchemaName = endpointConfig.responseSchemaName;
        const responseSchemaResource = endpointConfig.responseSchemaResource;
        const securitySchemes = endpointConfig.securitySchemes;

        securitySchemes.forEach(scheme => {
            switch (scheme) {
                case 'BasicAuth':
                    components.securitySchemes.BasicAuth = {
                        type: 'http',
                        scheme: 'basic'
                    };
                    break;
                case 'BearerAuth':
                    components.securitySchemes.BearerAuth = {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    };
                    break;
                case 'ApiKeyAuth':
                    components.securitySchemes.ApiKeyAuth = {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key'
                    };
                    break;
                case 'OpenID':
                    components.securitySchemes.OpenID = {
                        type: 'openIdConnect',
                        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration'
                    };
                    break;
                case 'OAuth2':
                    components.securitySchemes.OAuth2 = {
                        type: 'oauth2',
                        flows: {
                            authorizationCode: {
                                authorizationUrl: 'https://example.com/auth',
                                tokenUrl: 'https://example.com/token',
                                scopes: {
                                    'read:segnaPosto': 'read your segnaPosto',
                                    'write:segnaPosto': 'modify segnaPosto in your account'
                                }
                            }
                        }
                    };
                    break;
                default:
                    console.warn(`Unknown security scheme: ${scheme}`);
            }
        });

        endpointGenerator(serverUrl, method, path, parameters, requestSchemaName, requestSchemaResource, responseSchemaName, responseSchemaResource, securitySchemes);
    });

    swaggerDefinition.paths = paths;
    swaggerDefinition.components = components;

    return swaggerDefinition;
}

function convert(obj) {
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            return {
                type: "array",
                items: convert(obj[0])
            };
        } else {
            return {
                type: "array",
                items: {}
            };
        }
    } else if (typeof obj === 'object' && obj !== null) {
        let properties = {};
        for (let property in obj) {
            properties[property] = convert(obj[property]);
        }
        return {
            type: "object",
            properties: properties
        };
    } else if (typeof obj === 'number') {
        if (Number.isSafeInteger(obj)) {
            return { type: "integer", format: "int64", example: 10 };
        } else {
            return { type: "number", format: "" };
        }
    } else if (typeof obj === 'string') {
        let regxDate = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
            regxDateTime = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]).([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?(Z|(\+|\-)([0-1][0-9]|2[0-3]):[0-5][0-9])$/;
        if (regxDateTime.test(obj)) {
            return { type: "string", format: "date-time", example: "YYYY-MM-DDTHH:MM:SSZ" };
        } else if (regxDate.test(obj)) {
            return { type: "string", format: "date", example: "YYYY-MM-DD" };
        } else {
            return { type: "string", example: "string" };
        }
    } else if (typeof obj === 'boolean') {
        return { type: "boolean", example: true };
    } else {
        return { type: "null" };
    }
}


module.exports = { generateSwagger };