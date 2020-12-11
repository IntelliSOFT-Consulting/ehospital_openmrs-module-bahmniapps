# Bahmni Apps

[![Build Status](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps.svg?branch=master)](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps)

This repository acts as the front end for the **Bahmni EMR**. It is compeltely written in **AngularJS**.


# Build
cd ehospital_openmrs-module-bahmniapps/ui
1. yarn install
2. npm install
3. bower install
4. grunt clean -DskipTests
5. grunt --force
6. ssh to vagrant
7. sudo mv /var/www/bahmniapps /var/www/bahmniapps-original
8. sudo ln -s /bahmni/ehospital_openmrs-module-bahmniapps/ui/app /var/www/bahmniapps
9. sudo chown -h bahmni:bahmni /var/www/bahmniapps

# Project structure

<pre>
|-- .tx
|   
|-- scripts
|	
`-- ui
    |-- Gruntfile.js
    |-- app
    |	|-- admin
    |   |-- adt
    |   |-- clinical
    |   |-- common
    |   |-- document-upload
    |   |-- home
    |	|-- i18n
    |   |-- images
    |   |-- orders
    |   |-- registration
    |   |-- reports
    |
    |-- .jshint.rc
    |-- bower.json
    |-- package.json
</pre>