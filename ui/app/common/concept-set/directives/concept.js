'use strict';

angular.module('bahmni.common.conceptSet')
    .directive('concept', ['RecursionHelper', 'spinner', '$filter', 'messagingService', '$http',
        function (RecursionHelper, spinner, $filter, messagingService, $http) {
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

                scope.getBooleanResult = function (value) {
                    return !!value;
                };

                scope.patientFirstname = scope.patient.givenName;
                scope.patientMiddlename = scope.patient.middleName;
                scope.patientLastname = scope.patient.familyName;

                scope.concatenatePatientFullnames = function () {
                    var pNames = '';
                    scope.patientRegistrationNames = '';
                    scope.patientRegistrationNamesReversed = '';
                    if ((scope.patientFirstname !== null) && (scope.patientMiddlename !== null) && (scope.patientLastname !== null)) {
                        scope.patientRegistrationNames = pNames.concat(scope.patientFirstname, ' ', scope.patientMiddlename, ' ', scope.patientLastname);
                    } else if ((scope.patientFirstname !== null) && (scope.patientMiddlename == null) && (scope.patientLastname !== null)) {
                        scope.patientRegistrationNames = pNames.concat(scope.patientFirstname, ' ', scope.patientLastname);
                        scope.patientRegistrationNamesReversed = pNames.concat(scope.patientLastname, ' ', scope.patientFirstname);
                    } else if ((scope.patientFirstname !== null) && (scope.patientMiddlename !== null) && (scope.patientLastname == null)) {
                        scope.patientRegistrationNames = pNames.concat(scope.patientFirstname, '', scope.patientMiddlename);
                        scope.patientRegistrationNamesReversed = pNames.concat(scope.patientMiddlename, ' ', scope.patientFirstname);
                    } else {
                        scope.patientRegistrationNames = 'empty';
                        scope.patientRegistrationNamesReversed = 'empty';
                    }
                };
                scope.getMtibaTransacton = function () {

                    scope.mtibaCode = document.getElementById("observation_5").value;
                    scope.concatenatePatientFullnames();
                    scope.validateMtibaCode();
                };
                scope.validateMtibaCode = function () {
                    if (scope.mtibaCode !== null) {
                        var fetchData = $http.get(baseURl + scope.mtibaCode, {
                            withCredentials: true
                        });
                        fetchData = fetchData.then(function (response) {
                            if (response.data.status == 200) {
                                scope.patientProfile = response;
                                console.log("Patient Response",scope.patientProfile);
                                var pFirstName = scope.patientProfile.data.response.patient.firstName;
                                var pMiddleName = scope.patientProfile.data.response.patient.middleName;
                                var pLastName = scope.patientProfile.data.response.patient.lastName;
                                var ww = '';
                                var apiFullnames = ww.concat(pFirstName, ' ', pMiddleName, ' ', pLastName);
                                var apiFirstLastnames = ww.concat(pFirstName, ' ', pLastName);
                                var apiFirstMiddlenames = ww.concat(pFirstName, ' ', pMiddleName);
                                var apiLastFirstnames = ww.concat(pLastName, ' ', pFirstName);
                                var apiMiddleFirstNames = ww.concat(pMiddleName, ' ', pLastName);
                                var emrRegistrationName = scope.patientRegistrationNames;
                                var patientsRegistrationName = [apiFullnames, apiFirstLastnames, apiFirstMiddlenames, apiLastFirstnames, apiMiddleFirstNames];
                                var apiContainsRegisteredpatientNames = (patientsRegistrationName.indexOf(emrRegistrationName.toUpperCase()) > -1);
                                if ((scope.patientProfile.data.status == 200) && (apiContainsRegisteredpatientNames == true)) {
                                    scope.mtibaMessage = "Code Validated!!"
                                } else (
                                    scope.mtibaMessage = "Code not Validate!!"
                                )
                            } else {
                                scope.mtibaMessage = "Code not Validate!!"
                            }

                        });
                    } else {
                        scope.mtibaMessage = "Please enter a valid Code!!"
                    }
                };

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
