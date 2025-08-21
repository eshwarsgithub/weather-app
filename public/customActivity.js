/*
 * Custom Activity for Salesforce Marketing Cloud Journey Builder
 * Weather API Integration with Dynamic Field Selection
 */
(function() {
    'use strict';
    
    // Wait for Postmonger to be available with timeout
    function waitForPostmonger(callback) {
        var attempts = 0;
        var maxAttempts = 100; // 10 seconds maximum wait
        
        function check() {
            if (window.Postmonger) {
                console.log('Postmonger found after', attempts, 'attempts');
                callback();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, 100);
            } else {
                console.error('Postmonger not available after 10 seconds, creating mock');
                // Create a minimal mock for testing
                window.Postmonger = {
                    Session: function() {
                        return {
                            on: function(event, callback) {
                                console.log('Mock postmonger on:', event);
                                if (event === 'initActivity') {
                                    setTimeout(function() {
                                        callback({});
                                    }, 100);
                                }
                            },
                            trigger: function(event, data) {
                                console.log('Mock postmonger trigger:', event, data);
                            }
                        };
                    }
                };
                callback();
            }
        }
        check();
    }
    
    waitForPostmonger(function() {
        initializeActivity();
    });
    
    function initializeActivity() {

    var connection = new Postmonger.Session();
    var authTokens = {};
    var payload = {};
    var steps = [
        { "label": "Configure Weather Activity", "key": "step1" }
    ];
    var currentStep = steps[0].key;

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);
    connection.on('requestedInteraction', requestedInteraction);
    connection.on('requestedTriggerEventDefinition', requestedTriggerEventDefinition);
    connection.on('requestedDataSources', requestedDataSources);

    connection.on('clickedNext', save);
    connection.on('clickedBack', onClickedBack);
    connection.on('gotoStep', onGotoStep);

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger('requestInteraction');
        connection.trigger('requestTriggerEventDefinition');
        connection.trigger('requestDataSources');
    }

    function initialize(data) {
        console.log("Initializing Activity", data);
        
        if (data) {
            payload = data;
        }

        var inArguments = payload['arguments'] && payload['arguments'].execute && payload['arguments'].execute.inArguments || [];
        var outArguments = payload['arguments'] && payload['arguments'].execute && payload['arguments'].execute.outArguments || [];

        // Parse existing configuration if available
        if (inArguments.length > 0) {
            var existingConfig = inArguments[0];
            if (existingConfig.locationField) {
                $('#location-field').val(existingConfig.locationField);
            }
            if (existingConfig.locationFieldType) {
                $('#location-field-type').val(existingConfig.locationFieldType);
            }
            if (existingConfig.weatherConditions) {
                $('#weather-conditions').val(existingConfig.weatherConditions);
            }
        }

        // Add event listeners for real-time validation
        $('#location-field, #location-field-type, #weather-conditions').on('change', function() {
            connection.trigger('updateButton', {
                button: 'next',
                enabled: validateConfiguration()
            });
        });

        connection.trigger('updateButton', {
            button: 'next',
            text: 'done',
            visible: true,
            enabled: validateConfiguration()
        });
    }

    function onGetTokens(tokens) {
        console.log("Tokens:", tokens);
        authTokens = tokens;
    }

    function onGetEndpoints(endpoints) {
        console.log("Endpoints:", endpoints);
    }

    function requestedInteraction(interaction) {
        console.log("Requested Interaction:", interaction);
        populateDataFields(interaction);
    }

    function requestedTriggerEventDefinition(eventDefinition) {
        console.log("Requested Trigger Event Definition:", eventDefinition);
    }

    function requestedDataSources(dataSources) {
        console.log("Requested Data Sources:", dataSources);
    }

    function populateDataFields(interaction) {
        console.log('Populating data fields with interaction:', interaction);
        
        var $select = $('#location-field');
        if ($select.length === 0) {
            console.error('Location field select element not found!');
            return;
        }
        
        $select.empty();
        $select.append('<option value="">-- Select a field --</option>');

        // Add common contact attributes
        $select.append('<optgroup label="Contact Attributes">');
        $select.append('<option value="{{Contact.Attribute.Demographics.City}}">City</option>');
        $select.append('<option value="{{Contact.Attribute.Demographics.State}}">State</option>');
        $select.append('<option value="{{Contact.Attribute.Demographics.PostalCode}}">Postal Code</option>');
        $select.append('<option value="{{Contact.Attribute.Demographics.Country}}">Country</option>');
        $select.append('<option value="{{Contact.Key}}">Contact Key</option>');
        $select.append('</optgroup>');

        // Add event data if available
        if (interaction && interaction.triggers && interaction.triggers.length > 0) {
            console.log('Found triggers:', interaction.triggers.length);
            $select.append('<optgroup label="Event Data">');
            interaction.triggers.forEach(function(trigger, index) {
                console.log('Processing trigger', index, trigger);
                if (trigger.metaData && trigger.metaData.dataExtension) {
                    var de = trigger.metaData.dataExtension;
                    console.log('Found data extension:', de.name, 'with', de.fields ? de.fields.length : 0, 'fields');
                    if (de.fields) {
                        de.fields.forEach(function(field) {
                            var fieldPath = '{{Event.' + de.name + '.' + field.name + '}}';
                            $select.append('<option value="' + fieldPath + '">' + field.name + ' (Event)</option>');
                            console.log('Added field:', field.name);
                        });
                    }
                } else if (trigger.dataExtension) {
                    // Alternative structure
                    var de = trigger.dataExtension;
                    console.log('Found alternative data extension:', de.name);
                    if (de.fields) {
                        de.fields.forEach(function(field) {
                            var fieldPath = '{{Event.' + de.name + '.' + field.name + '}}';
                            $select.append('<option value="' + fieldPath + '">' + field.name + ' (Event)</option>');
                        });
                    }
                }
            });
            $select.append('</optgroup>');
        } else {
            console.log('No triggers found in interaction');
        }

        // Add entry data if available
        if (interaction && interaction.entryData) {
            console.log('Found entry data:', interaction.entryData);
            $select.append('<optgroup label="Entry Data">');
            // Add entry data fields dynamically
            $select.append('</optgroup>');
        }

        // Add custom data extension fields
        $select.append('<optgroup label="Common Location Fields">');
        $select.append('<option value="{{Contact.Attribute.Address}}">Address</option>');
        $select.append('<option value="{{Contact.Attribute.City}}">City</option>');
        $select.append('<option value="{{Contact.Attribute.State}}">State</option>');
        $select.append('<option value="{{Contact.Attribute.PostalCode}}">Postal Code</option>');
        $select.append('<option value="{{Contact.Attribute.Latitude}}">Latitude</option>');
        $select.append('<option value="{{Contact.Attribute.Longitude}}">Longitude</option>');
        $select.append('</optgroup>');
        
        console.log('Finished populating data fields. Total options:', $select.find('option').length);
    }

    function save() {
        var locationField = $('#location-field').val();
        var locationFieldType = $('#location-field-type').val();
        var weatherConditions = $('#weather-conditions').val();

        // Validation
        if (!locationField) {
            alert('Please select a location field');
            return;
        }

        if (!locationFieldType) {
            alert('Please select a location field type');
            return;
        }

        // Validate weather conditions
        if (!weatherConditions || weatherConditions === '') {
            weatherConditions = 'rain,snow,storm'; // Default conditions
        }

        // Create the payload for the activity
        payload['arguments'] = payload['arguments'] || {};
        payload['arguments'].execute = payload['arguments'].execute || {};
        payload['metaData'] = payload['metaData'] || {};

        payload['arguments'].execute.inArguments = [{
            contactKey: "{{Contact.Key}}",
            locationField: locationField,
            locationFieldType: locationFieldType,
            weatherConditions: weatherConditions
        }];

        payload['arguments'].execute.outArguments = [{
            weatherCondition: {
                dataType: "Text",
                isNullable: false,
                direction: "out"
            },
            temperature: {
                dataType: "Number",
                isNullable: true,
                direction: "out"
            },
            humidity: {
                dataType: "Number",
                isNullable: true,
                direction: "out"
            },
            description: {
                dataType: "Text",
                isNullable: true,
                direction: "out"
            }
        }];

        // Mark as configured
        payload['metaData'].isConfigured = true;

        console.log("Saving configuration:", payload);
        connection.trigger('updateActivity', payload);
    }

    function onClickedBack() {
        connection.trigger('prevStep');
    }

    function onGotoStep(step) {
        showStep(step);
        connection.trigger('ready');
    }

    function showStep(step, stepIndex) {
        if (stepIndex && !step) {
            step = steps[stepIndex - 1];
        }

        currentStep = step.key;
        $('.step').hide();

        switch (step.key) {
            case 'step1':
                $('#step1').show();
                connection.trigger('updateButton', {
                    button: 'next',
                    enabled: validateConfiguration(),
                    text: 'done'
                });
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: false
                });
                break;
        }
    }

    function getMessage() {
        var locationField = $('#location-field').val();
        var locationFieldType = $('#location-field-type').val();
        return locationField && locationFieldType;
    }

    function validateConfiguration() {
        var locationField = $('#location-field').val();
        var locationFieldType = $('#location-field-type').val();
        
        if (!locationField || locationField.trim() === '') {
            return false;
        }
        
        if (!locationFieldType || locationFieldType.trim() === '') {
            return false;
        }
        
        return true;
    }
    
    } // End of initializeActivity function
    
})(); // End of IIFE