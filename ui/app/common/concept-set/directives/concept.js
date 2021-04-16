'use strict';

angular.module('bahmni.common.conceptSet')
    .directive('concept', ['RecursionHelper', 'spinner', '$filter', 'messagingService', '$http', '$timeout', 'ngDialog',
        function (RecursionHelper, spinner, $filter, messagingService, $http, $timeout, ngDialog) {
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

                scope.scopestoppedTyping = function () {
                    document.getElementById('btnSave').disabled = true;
                    scope.mtibaMessage = "";
                    if (document.getElementById("MtibaTransactionNumber").value.length > 0) {
                        document.getElementById('btnValidate').disabled = false;
                    } else {
                        document.getElementById('btnValidate').disabled = true;
                        document.getElementById('btnSave').disabled = true;
                        scope.mtibaMessage = "";
                    }

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

                scope.patientFirstname = scope.patient.givenName;
                scope.patientMiddlename = scope.patient.middleName;
                scope.patientLastname = scope.patient.familyName;

                scope.concatenatePatientFullnames = function () {
                    var pNames = '';
                    scope.patientRegistrationNames = '';
                    scope.patientRegistrationNamesUnformarted = '';
                    scope.patientRegistrationNamesReversed = '';
                    scope.patientFirstLastName = '';
                    scope.patientFirstLastNameReversed = '';
                    if ((scope.patientFirstname !== null) && (scope.patientMiddlename !== null) && (scope.patientLastname !== null)) {
                        scope.patientRegistrationNames = pNames.concat(scope.patientFirstname, ' ', scope.patientMiddlename, ' ', scope.patientLastname).replace(/ /g, '');
                        scope.patientRegistrationNamesUnformarted = pNames.concat(scope.patientFirstname, ' ', scope.patientMiddlename, ' ', scope.patientLastname);
                    } else if ((scope.patientFirstname !== null) && (scope.patientMiddlename == null) && (scope.patientLastname !== null)) {
                        scope.patientRegistrationNames = pNames.concat(scope.patientFirstname, ' ', scope.patientLastname).replace(/ /g, '');
                        scope.patientRegistrationNamesReversed = pNames.concat(scope.patientLastname, ' ', scope.patientFirstname).replace(/ /g, '');
                        scope.patientRegistrationNamesUnformarted = pNames.concat(scope.patientFirstname, ' ', scope.patientLastname);
                        scope.patientFirstLastName = pNames.concat(scope.patientFirstname, ' ', scope.patientLastname).replace(/ /g, '');
                        scope.patientFirstLastNameReversed = pNames.concat(scope.patientLastname, ' ', scope.patientFirstname).replace(/ /g, '');
                    } else if ((scope.patientFirstname !== null) && (scope.patientMiddlename !== null) && (scope.patientLastname == null)) {
                        scope.patientRegistrationNames = pNames.concat(scope.patientFirstname, '', scope.patientMiddlename).replace(/ /g, '');
                        scope.patientRegistrationNamesReversed = pNames.concat(scope.patientMiddlename, ' ', scope.patientFirstname).replace(/ /g, '');
                        scope.patientRegistrationNamesUnformarted = pNames.concat(scope.patientFirstname, '', scope.patientMiddlename);
                    } else {
                        scope.patientRegistrationNames = 'empty';
                        scope.patientRegistrationNamesReversed = 'empty';
                        scope.patientRegistrationNamesUnformarted = 'empty';
                    }
                };


                scope.getMtibaTransacton = function () {
                    scope.mtibaCode = document.getElementById("MtibaTransactionNumber").value;
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
                                var pFirstName = scope.patientProfile.data.response.patient.firstName;
                                var pMiddleName = scope.patientProfile.data.response.patient.middleName;
                                var pLastName = scope.patientProfile.data.response.patient.lastName;
                                scope.pAccountStatus = scope.patientProfile.data.response.accountHolder.account.status;
                                scope.pAccountLimit = scope.patientProfile.data.response.accountHolder.account.limit.amount;
                                scope.pAccountCurrency = scope.patientProfile.data.response.accountHolder.account.limit.currency;
                                var pIdenfifications = scope.patientProfile.data.response.patient.identifications;

                                for (var i = 0, l = pIdenfifications.length; i < l; i++) {
                                    var identification = pIdenfifications[i];
                                    if ((identification.type == "NATIONAL_ID") && (identification.number !== null)) {
                                        scope.pNationalID = identification.number;
                                    }
                                }
                                var ww = '';
                                var apiFullnames = ww.concat(pFirstName, ' ', pMiddleName, ' ', pLastName).replace(/ /g, '');
                                var apiNames = '';
                                scope.apiFullnamesUnformatted = '';
                                if ((pFirstName !== null) && (pMiddleName !== null) && (pLastName !== null)) {
                                    scope.apiFullnamesUnformatted = apiNames.concat(pFirstName, ' ', pMiddleName, ' ', pLastName);
                                } else if ((pFirstName !== null) && (pMiddleName == null) && (pLastName !== null)) {
                                    scope.apiFullnamesUnformatted = apiNames.concat(pFirstName, ' ', pLastName);
                                } else if ((pFirstName !== null) && (pMiddleName !== null) && (pLastName == null)) {
                                    scope.apiFullnamesUnformatted = apiNames.concat(pFirstName, '', pMiddleName);
                                } else {
                                    scope.apiFullnamesUnformatted = 'empty';
                                }

                                var apiFirstLastnames = ww.concat(pFirstName, ' ', pLastName).replace(/ /g, '');
                                var apiFirstMiddlenames = ww.concat(pFirstName, ' ', pMiddleName).replace(/ /g, '');
                                var apiLastFirstnames = ww.concat(pLastName, ' ', pFirstName).replace(/ /g, '');
                                var apiMiddleFirstNames = ww.concat(pMiddleName, ' ', pLastName).replace(/ /g, '');
                                var emrRegistrationName = scope.patientRegistrationNames;
                                var patientsRegistrationName = [apiFullnames.toUpperCase(), apiFirstLastnames.toUpperCase(), apiFirstMiddlenames.toUpperCase(), apiLastFirstnames.toUpperCase(), apiMiddleFirstNames.toUpperCase()];
                                var apiContainsRegisteredpatientNames = (patientsRegistrationName.indexOf(scope.patientRegistrationNames.toUpperCase()) > -1);
                                if ((scope.patientProfile.data.status == 200) && (apiContainsRegisteredpatientNames == true)) {
                                    scope.validCodePopup();
                                    scope.mtibaMessage = "Valid Code!"
                                    document.getElementById('btnSave').disabled = false;
                                } else if ((scope.patientProfile.data.status == 200) && (apiContainsRegisteredpatientNames == false)) {
                                    scope.mtibaMessage = "Code Does Not Match This patient!"
                                    scope.displayConfirmationDialogs();
                                    document.getElementById('btnSave').disabled = true;
                                }
                                else {
                                    scope.mtibaMessage = "Code Does Not Match This patient!"
                                    document.getElementById('btnSave').disabled = true;
                                }

                            } else {
                                scope.mtibaMessage = "Invalid Code!"
                                scope.invalidCodePopup();
                            }

                        });
                    } else {
                        scope.mtibaMessage = "Please enter a valid Code!!"
                    }
                };

                scope.disableValidateButton = function () {
                    var promise = $timeout(function () {
                        document.getElementById('btnValidate').disabled = 'disabled';
                        document.getElementById('btnSave').disabled = 'disabled';
                    }, 2000);
                    return promise;
                };

                scope.disableValidateButton();

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
