'use strict';

angular.module('bahmni.common.conceptSet')
    .directive('concept', ['RecursionHelper', 'spinner', '$filter', 'messagingService', 'providerService', '$http', '$timeout', 'ngDialog',
        function (RecursionHelper, spinner, $filter, messagingService, providerService, $http, $timeout, ngDialog) {
            var link = function (scope) {
                var hideAbnormalbuttonConfig = scope.observation && scope.observation.conceptUIConfig && scope.observation.conceptUIConfig['hideAbnormalButton'];
                var baseURl = "/../openmrs/ws/rest/v1/mtibaapi/treatments/"

                scope.now = moment().format("YYYY-MM-DD hh:mm:ss");
                scope.showTitle = scope.showTitle === undefined ? true : scope.showTitle;
                scope.hideAbnormalButton = hideAbnormalbuttonConfig == undefined ? scope.hideAbnormalButton : hideAbnormalbuttonConfig;

                scope.cloneNew = function (observation, parentObservation) {
                    observation.showAddMoreButton = function () {
                        return false;
                    };
                    var newObs = observation.cloneNew();
                    newObs.scrollToElement = true;
                    var index = parentObservation.groupMembers.indexOf(observation);
                    parentObservation.groupMembers.splice(index + 1, 0, newObs);
                    messagingService.showMessage("info", "A new " + observation.label + " section has been added");
                    scope.$root.$broadcast("event:addMore", newObs);
                };

                scope.removeClonedObs = function (observation, parentObservation) {
                    observation.voided = true;
                    var lastObservationByLabel = _.findLast(parentObservation.groupMembers, function (groupMember) {
                        return groupMember.label === observation.label && !groupMember.voided;
                    });

                    lastObservationByLabel.showAddMoreButton = function () { return true; };
                    observation.hidden = true;
                };

                scope.isClone = function (observation, parentObservation) {
                    if (parentObservation && parentObservation.groupMembers) {
                        var index = parentObservation.groupMembers.indexOf(observation);
                        return (index > 0) ? parentObservation.groupMembers[index].label == parentObservation.groupMembers[index - 1].label : false;
                    }
                    return false;
                };

                scope.isRemoveValid = function (observation) {
                    if (observation.getControlType() == 'image') {
                        return !observation.value;
                    }
                    return true;
                };

                scope.getStringValue = function (observations) {
                    return observations.map(function (observation) {
                        return observation.value + ' (' + $filter('bahmniDate')(observation.date) + ")";
                    }).join(", ");
                };

                scope.toggleSection = function () {
                    scope.collapse = !scope.collapse;
                };

                scope.isCollapsibleSet = function () {
                    return scope.showTitle == true;
                };

                scope.hasPDFAsValue = function () {
                    return scope.observation.value && (scope.observation.value.indexOf(".pdf") > 0);
                };

                scope.$watch('collapseInnerSections', function () {
                    scope.collapse = scope.collapseInnerSections && scope.collapseInnerSections.value;
                });

                scope.handleUpdate = function () {
                    scope.$root.$broadcast("event:observationUpdated-" + scope.conceptSetName, scope.observation.concept.name, scope.rootObservation);
                };

                scope.update = function (value) {
                    if (scope.getBooleanResult(scope.observation.isObservationNode)) {
                        scope.observation.primaryObs.value = value;
                    } else if (scope.getBooleanResult(scope.observation.isFormElement())) {
                        scope.observation.value = value;
                    }
                    scope.handleUpdate();
                };

                scope.displayConfirmationDialogs = function () {
                    ngDialog.openConfirm({
                        template: '../common/concept-set/views/templates/patientMismatch.html',
                        scope: scope,
                        closeByEscape: true
                    });
                };
                scope.invalidCodePopup = function () {
                    ngDialog.openConfirm({
                        template: '../common/concept-set/views/templates/invalidCodePopup.html',
                        scope: scope,
                        closeByEscape: true
                    });
                };
                scope.validCodePopup = function () {
                    ngDialog.openConfirm({
                        template: '../common/concept-set/views/templates/validCodePopup.html',
                        scope: scope,
                        closeByEscape: true
                    });
                };



                scope.getBooleanResult = function (value) {
                    return !!value;
                };

                var mapProvider = function (result) {
                    scope.providers = _.map(result.data.results, function (provider) {
                        var response = {
                            value: provider.display || provider.person.display,
                            uuid: provider.uuid,
                            identifier: provider.identifier
                        };
                        return response;
                    });
                    return scope.providers;
                };

                scope.getProviders = function (params) {
                    if (params !== undefined) {
                        return providerService.search(params.term).then(mapProvider);
                    }
                };

                scope.responseMap = function (data) {
                    return _.map(data, function (providerInfo) {
                        providerInfo.label = data.value;
                        providerInfo.identifier = data.identifier;
                        return providerInfo;
                    });
                };

                scope.mapProviderToUuid = function (providerInfo) {
                    if (scope.observation.value !== providerInfo.uuid) {
                        scope.observation.value = providerInfo.uuid;
                    }
                };

                scope.valChange = function (params) {
                    angular.forEach(scope.providers, function (value, key) {
                        if (value.value.includes(params)) {
                            scope.observation.value = value.uuid;
                        }
                    });
                };

                scope.isCustomConceptType = function (conceptName) {
                    var customConceptTypes = [
                        "Assigned Visit Provider"
                    ]
                    return customConceptTypes.indexOf(conceptName) !== -1;
                }

            };
            var compile = function (element) {
                return RecursionHelper.compile(element, link);
            };

            return {
                restrict: 'E',
                compile: compile,
                scope: {
                    conceptSetName: "=",
                    observation: "=",
                    atLeastOneValueIsSet: "=",
                    showTitle: "=",
                    conceptSetRequired: "=",
                    rootObservation: "=",
                    patient: "=",
                    collapseInnerSections: "=",
                    rootConcept: "&",
                    hideAbnormalButton: "="
                },
                templateUrl: '../common/concept-set/views/observation.html'
            };
        }]);
