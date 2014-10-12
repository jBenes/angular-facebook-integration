angular.module('facebook-integration.core', [])

.factory('fbAdapterInterface', ['$q', function ($q) {

    var deferred = $q.defer();

    return {
        $deferred: deferred,
        $promise: deferred.promise,
        /**
         * json settings
         */
        init: function(settings) {},
        isNative: function() {},
        getLoginStatus: function() {},
        /**
         * string permissions
         */
        login: function(permissions) {},
        logout: function() {},
        /**
         * string path
         * string method
         * json params
         * string permissions
         */
        api: function(path, method, params, permissions) {},
        revokePermissions: function() {},
        /**
         * json options
         */
        showDialog:  function(options) {}
    }

}])

.factory('OpenFBAdapter', ['$window', '$q', 'fbAdapterInterface', function ($window, $q, fbAdapterInterface) {

    var self = function(openFB) {
        this.lib = openFB;
    }

    self.prototype = Object.create(fbAdapterInterface);

    self.prototype.init = function(settings) {
        this.lib.init(settings);
        this.$deferred.resolve();
    }

    self.prototype.isNative = function(settings) {
        return false;
    }

    self.prototype.getLoginStatus = function() {
        var deferred = $q.defer();
        this.lib.getLoginStatus(function(res) {
            deferred.resolve(res);
        });
        return deferred.promise;
    }

    self.prototype.login = function(permissions) {
        var deferred = $q.defer();
        var options = null;
        if(permissions) {
            options = {
                scope: permissions
            }
        }

        this.lib.login(function(res) {
            deferred.resolve(res);
        }, options);
        return deferred.promise;
    }

    self.prototype.logout = function() {
        var deferred = $q.defer();
        this.lib.logout(function(res) {
            deferred.resolve(res);
        });
        return deferred.promise;
    }

    self.prototype.api = function(path, method, params, permissions) {
        var deferred = $q.defer();
        var options = {
            path: path,
            method: method,
            params: params,
            success: function(res) {
                deferred.resolve(res);
            },
            error: function(res) {
                deferred.reject(res);
            }
        }
        this.lib.api(options);
        return deferred.promise;
    }

    self.prototype.revokePermissions = function() {
        var deferred = $q.defer();
        this.lib.login(function(res) {
            deferred.resolve(res);
        }, function(res) {
            deferred.reject(res);
        });
        return deferred.promise;
    }

    self.prototype.showDialog = function(options) {
        var path = '/me/' + options.method;
        delete options['method'];
        var method = 'POST';
        var permissions = 'publish_actions';

        return this.api(path, method, options, permissions);
    }

    return new self($window.openFB);

}])

.factory('facebookConnectPluginAdapter', ['$window', '$q', '$ionicPlatform', 'fbAdapterInterface', function ($window, $q, $ionicPlatform, fbAdapterInterface) {

    function toQueryString(obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }

    var self = function() {}

    self.prototype = Object.create(fbAdapterInterface);

    self.prototype.init = function(settings) {
        var self = this;

        $ionicPlatform.ready(function() {
            self.lib = $window.facebookConnectPlugin;
            self.$deferred.resolve();
        });
    }

    self.prototype.isNative = function(settings) {
        return true;
    }

    self.prototype.getLoginStatus = function() {
        var deferred = $q.defer();
        this.lib.getLoginStatus(function(res) {
            deferred.resolve(res);
        }, function(res) {
            deferred.reject(res);
        });
        return deferred.promise;
    }

    self.prototype.login = function(permissions) {
        var deferred = $q.defer();
        this.lib.login([permissions], function(res) {
            deferred.resolve(res);
        }, function(res) {
            deferred.resolve(res);
        });
        return deferred.promise;
    }

    self.prototype.logout = function() {
        var deferred = $q.defer();
        this.lib.logout(function(res) {
            deferred.resolve(res);
        }, function(res) {
            deferred.reject(res);
        });
        return deferred.promise;
    }

    self.prototype.api = function(path, method, params, permissions) {
        var deferred = $q.defer();
        this.lib.api(path + '?' + toQueryString(params) + '&method=' + method, [permissions], function(res) {
            deferred.resolve(res);
        }, function(res) {
            deferred.reject(res);
        });
        return deferred.promise;
    }

    self.prototype.showDialog = function(options) {
        var deferred = $q.defer();
        this.lib.showDialog(options, function(res) {
            deferred.resolve(res);
        }, function(res) {
            deferred.reject(res);
        });
        return deferred.promise;
    }

    return new self();

}])


angular.module('facebook-integration', ['facebook-integration.core'])

.provider('fbAdapter', [function () {

    this.settings = {};
    this.adapter = null;

    this.setSettings = function(settings) {
        this.settings = settings;
    }

    this.chooseAdapter = function(adapter) {
        this.adapter = adapter;
    }

    this.$get = ['$q', '$window', '$injector', function ($q, $window, $injector) {

        var adapter = $injector.get(this.adapter);

        adapter.init(this.settings);

        return adapter;

    }];

}]);
