/**
 * Created by jkalweit on 4/10/2014.
 */

function Fingerprint() {
    this.scannerService = 'http://localhost:8231/finger';
    this.userService = 'http://server1.imt.local/auth/fingerprint/firtext?template=';
    this.roleService = 'http://server1.imt.local/auth/role/isauthorized';
}

Fingerprint.prototype.scanFingerprint = function (success, error, statusCallback) {

    if(statusCallback)
        statusCallback('Scanning fingerprint...');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.scannerService, true);
    xhr.onload = function() {
        if (this.status == 200) {
            success(JSON.parse(this.responseText));
        } else {
            error('Failed to scan fingerprint: ' + this.status + ': ' + this.statusText);
        }
    };
    xhr.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 0) {
            error('Could not reach fingerprint scanner service.');
        }
    };
    xhr.send();
};

Fingerprint.prototype.getUsernameFromFingerprint = function (firText, success, error) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.userService + firText, true);
    xhr.onload = function() {
        if (this.status == 200) {
            success(JSON.parse(this.responseText));
        } else {
            error('Failed to get username: ' + this.status + ': ' + this.statusText);
        }
    };
    xhr.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 0) {
            error('Could not reach user service.');
        }
    };
    xhr.send();
};

Fingerprint.prototype.getIsAuthorized = function (username, role, success, error) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.roleService + '?username=' + username + '&role=' + role, true);
    xhr.onload = function() {
        if (this.status == 200) {
            success(JSON.parse(this.responseText));
        } else {
            error('Failed to get authorization: ' + this.status + ': ' + this.statusText);
        }
    };
    xhr.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 0) {
            error('Could not reach role service.');
        }
    };
    xhr.send();
};

Fingerprint.prototype.getUsername = function (success, error, statusCallback) {
    var self = this;
    this.scanFingerprint(function (result) {
        if (result.status === 'success') {
            if(statusCallback)
                statusCallback('Getting username...');
            self.getUsernameFromFingerprint(result.message, function(result2) {
                if(result2.status === 'success')
                    success(result2.message);
                else
                    error('Failed to get username: ' + result2.message);
            }, error);
        } else {
            error(result.message);
        }
    }, error);


};


angular.module('fingerprintAuth', [])
    .factory('fingerprintAuth', function($q, $timeout) {
        var fingerprint = new Fingerprint();

        var service = {
            status: 'Ready.',
            setStatus: function (status) {
                $timeout(function () {
                    service.status = status;
                });
            },
            getUsername: function () {
                var deferred = $q.defer();
                service.setStatus('Scanning fingerprint...');
                fingerprint.getUsername(function (result) {
                    service.setStatus('Ready.');
                    deferred.resolve(result);
                }, function (err) {
                    service.setStatus('Ready.');
                    deferred.reject(err);
                }, function(status) {
                    service.setStatus(status);
                });


                return deferred.promise;
            }
        };

        return service;
    });

