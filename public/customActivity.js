/*
 * Custom Activity for Salesforce Marketing Cloud Journey Builder
 * Weather API Integration with Dynamic Field Selection
 */
define([
    'postmonger'
], function (Postmonger) {
    'use strict';

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

        connection.trigger('updateButton', {
            button: 'next',
            text: 'done',
            visible: true
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
        var $select = $('#location-field');
        $select.empty();
        $select.append('<option value="">-- Select a field --</option>');

        // Add common contact attributes
        $select.append('<optgroup label="Contact Attributes">');
        $select.append('<option value="{{Contact.Attribute.Demographics.City}}">City</option>');
        $select.append('<option value="{{Contact.Attribute.Demographics.State}}">State</option>');
        $select.append('<option value="{{Contact.Attribute.Demographics.PostalCode}}">Postal Code</option>');
        $select.append('<option value="{{Contact.Attribute.Demographics.Country}}">Country</option>');
        $select.append('</optgroup>');

        // Add event data if available
        if (interaction && interaction.triggers) {
            $select.append('<optgroup label="Event Data">');
            interaction.triggers.forEach(function(trigger) {
                if (trigger.metaData && trigger.metaData.dataExtension) {
                    var de = trigger.metaData.dataExtension;
                    if (de.fields) {
                        de.fields.forEach(function(field) {
                            var fieldPath = '{{Event.' + de.name + '.' + field.name + '}}';
                            $select.append('<option value="' + fieldPath + '">' + field.name + ' (Event)</option>');
                        });
                    }
                }
            });
            $select.append('</optgroup>');
        }

        // Add custom data extension fields
        $select.append('<optgroup label="Custom Fields">');
        $select.append('<option value="{{Contact.Attribute.CustomDE.Latitude}}">Custom Latitude</option>');
        $select.append('<option value="{{Contact.Attribute.CustomDE.Longitude}}">Custom Longitude</option>');
        $select.append('<option value="{{Contact.Attribute.CustomDE.Location}}">Custom Location</option>');
        $select.append('</optgroup>');
    }

    function save() {
        var locationField = $('#location-field').val();
        var locationFieldType = $('#location-field-type').val();
        var weatherConditions = $('#weather-conditions').val();

        if (!locationField) {
            alert('Please select a location field');
            return;
        }

        if (!locationFieldType) {
            alert('Please select a location field type');
            return;
        }

        // Create the payload for the activity
        payload['arguments'] = payload['arguments'] || {};
        payload['arguments'].execute = payload['arguments'].execute || {};

        payload['arguments'].execute.inArguments = [{
            contactKey: "{{Contact.Key}}",
            locationField: locationField,
            locationFieldType: locationFieldType,
            weatherConditions: weatherConditions || "rain,snow,storm"
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
                    enabled: Boolean(getMessage())
                });
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: false
                });
                break;
        }
    }

    function getMessage() {
        return $('#location-field').val() && $('#location-field-type').val();
    }

});