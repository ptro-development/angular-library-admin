'use strict';

angular.
    module('core.config').
        factory('Config', function() {
            const config_data = {
                "CONFIG": {
                    "API_URL": "http://localhost:8080/library"
                    }
                };
            return config_data;
        });
