/**
 * Created by Mike Pugh on 10/30/13.
 *
 * ngHttpCircuitBreaker is an attempt to model the circuit-breaker pattern for angular services and $http calls. For a
 * great explanation of the benefits of the circuit-breaker pattern,
 * see http://techblog.netflix.com/2011/12/making-netflix-api-more-resilient.html.
 *
 * Please note that while a client-side angular circuit breaker should help reduce load on your backend servers in the
 * event of system failures, it is not a replacement for server side circuit breakers / fail-over designs. The point of
 * the client side circuit breaker is to lessen the demand for doomed requests against your server, hopefully giving the
 * server time to recover.
 *
 * The ngHttpCircuitBreaker can support one or more endpoints, using regular expressions to define each circuit. For
 * example, if your application calls two different sets of APIs, you can selectively choose which one(s) you want to
 * protect with the circuit breaker.
 *
 * For each circuit you can specify:
 *  1) endpoint regular expression - the regex to test the $http.config.url
 *  2) failure limit - the number of errors you'll accept before you want the circuit breaker to trip into the OPEN state
 *  3) response sla - the time in ms to allow the $http service to wait for a response before timing out (timeouts are an important part of the fail fast mindset)
 *  4) half open time - the time in ms until an open circuit should transition to half-open
 *  5) status codes to ignore - an array of HTTP failure status codes that should be ignored (such as 401 - Authorization Required)
 *
 * Your client application must be designed to gracefully handle error responses - once tripped the circuit breaker will
 * reject all requests immediately until the half-open time has elapsed. At that point it will allow a single request to pass through
 * to the backend server - while that request is waiting for a response the circuit will transition back to the OPEN state and reject all requests.
 * If the single request that went through during the half open state responds successfully, the circuit will immediately move to the CLOSED state
 * and allow all requests to go through again.
 *
 *
 *
 * The MIT License (MIT)

 Copyright (c) 2013 - Mike Pugh

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 *
 */

(function() {
    "use strict";

    var module = angular.module('ng-http-circuitbreaker', []);
    module.provider('ngHttpCircuitBreakerConfig', ngHttpCircuitBreakerProvider);

    // Circuit State constants
    var STATE_CLOSED = 0,
        STATE_HALF_OPEN = 1,
        STATE_OPEN = 2;

    function ngHttpCircuitBreakerProvider() {
        var config = {
            circuits: []
        };
        /**
         * The ngHttpCircuitBreakerConfigProvider provides a circuit method which can be chained to define the HTTP routes that should be encapsulated as circuits behind the circuit breaker http transform.
         *
         * @param circuitConfig.endPointRegEx -         (REQUIRED) A regular expression to match the URL of the $http request config
         * @param circuitConfig.failureLimit -          (OPTIONAL: Default = 5) The number of error responses you'll accept before you want to OPEN the circuit.
         * @param circuitConfig.responseSLA -           (OPTIONAL: Default = 500) The maximum response time (in ms) deemed acceptable before forcing an active request to timeout. Set to 0 if you do not want an SLA timeout injected into your circuit's calls.
         * @param circuitConfig.timeUntilHalfOpen -     (OPTIONAL: Default = 5000) The time (in ms) an OPEN circuit should wait until moving to the HALF-OPEN state.
         * @param circuitConfig.statusCodesToIgnore -   (OPTIONAL: Default = [401, 403, 409]) An array of HTTP Status Codes to ignore.
         * @returns {ngHttpCircuitBreakerProvider}
         */
        this.circuit = function circuit(circuitConfig) {
            if(!circuitConfig) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Circuit Config required'};
            }

            if(!circuitConfig.endPointRegEx) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Circuit Endpoint Regular Expression required'};
            }

            if(!circuitConfig.endPointRegEx.test) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Circuit Parameter endPointRegEx must be a regular expression'};
            }

            for(var i = 0; i < config.circuits.length; i++) {
                if(config.circuits[i].endPointRegEx.toString().toUpperCase() === circuitConfig.endPointRegEx.toString().toUpperCase()) {
                    throw {source: 'ngHttpCircuitBreakerConfig', message: 'Duplicate endpoint regular expression found'};
                }
            }

            // default to 5
            if(isNaN(circuitConfig.failureLimit)) {
                circuitConfig.failureLimit = 5;
            }

            if(circuitConfig.failureLimit <= 0) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Invalid failure limit - must be positive, non-zero value'};
            }

            // default to 500
            if(isNaN(circuitConfig.responseSLA)) {
                circuitConfig.responseSLA = 500;
            }

            if(circuitConfig.responseSLA < 0) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Invalid Response SLA - must be non-negative. Set to 0 if you do not want a response sla to be set.'};
            }

            // default to 5 seconds
            if(isNaN(circuitConfig.timeUntilHalfOpen)) {
                circuitConfig.timeUntilHalfOpen = 5000;
            }

            if(circuitConfig.timeUntilHalfOpen <= 0) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Invalid Circuit timeUntilHalfOpen - must be a positive non-zero integer value'};
            }

            // Inject some default status codes to ignore if none are specified by the caller. Ignore auth & validation error codes.
            if(!circuitConfig.statusCodesToIgnore) {
                circuitConfig.statusCodesToIgnore = [401,403,409];
            }

            if(!Array.isArray(circuitConfig.statusCodesToIgnore)) {
                throw {source: 'ngHttpCircuitBreakerConfig', message: 'Invalid statusCodesToIgnore - expecting array of integer values representing HTTP response codes'};
            }

            config.circuits.push({
                endPointRegEx: circuitConfig.endPointRegEx,
                failureLimit: circuitConfig.failureLimit,
                responseSLA: circuitConfig.responseSLA,
                timeUntilHalfOpen: circuitConfig.timeUntilHalfOpen,
                statusCodesToIgnore: circuitConfig.statusCodesToIgnore,
                STATE: STATE_CLOSED,       // closed state
                failureCount: 0 // initial failure count
            });
            return this;
        };
        this.$get = function $get() {
            return config;
        }
    }

    module.factory('ngHttpCircuitBreaker', ['ngHttpCircuitBreakerConfig', '$q', '$timeout', function(cktConfig, $q, $timeout) {
        return {
            request: function request(config) {
                for (var i = 0; i < cktConfig.circuits.length; i++) {
                    if (cktConfig.circuits[i].endPointRegEx.test(config.url)) {
                        var circuit = cktConfig.circuits[i];
                        // To save on lookup times on response processing, add the circuit index to the config object which will be included within the response
                        config.cktbkr = {
                            circuit: i
                        };

                        if (circuit.STATE === STATE_CLOSED || circuit.STATE === STATE_HALF_OPEN) {

                            // Inject the SLA timeout only if it is a number and is greater than 0
                            if(cktConfig.circuits[i].responseSLA > 0) {
                                config.timeout = cktConfig.circuits[i].responseSLA;
                            }

                            // We only want to allow one attempt, so set state back to OPEN - if this call succeeds it will set state to CLOSED
                            if(circuit.STATE === STATE_HALF_OPEN) {
                                circuit.STATE = STATE_OPEN;
                            }
                            // Don't look for more circuits
                            break;
                        } else if (circuit.STATE === STATE_OPEN) {
                            // open state, reject everything
                            // todo: Do something here to indicate the failure is circuit breaker related ??
                            return $q.reject(config);
                        }
                    }
                }
                return config || $q.when(config);
            },
            response: function (response) {
                if(response.config.cktbkr) {
                    var circuit = cktConfig.circuits[response.config.cktbkr.circuit];
                    if (circuit.STATE === STATE_OPEN) {
                        // circuit is currently open, which means this is the one request that made it through during the half-open transition
                        // since it is successful, set the state to CLOSED and reset failure count
                        circuit.STATE = STATE_CLOSED;
                        circuit.failureCount = 0;
                    } else if(circuit.failureCount > 0) {
                        // only decrement the failure count if it's greater than zero
                        circuit.failureCount -= 1;
                    }
                }
                return response || $q.when(response);
            },
            responseError: function responseError(response) {
                //console.log(response);
                // Only process responses where the config has been extended with the cktbkr object
                if (response.config && response.config.cktbkr) {
                    var circuit = cktConfig.circuits[response.config.cktbkr.circuit];
                    // determine if the status code should be ignored
                    for (var i = 0; i < circuit.statusCodesToIgnore.length; i++) {
                        if (response.status === circuit.statusCodesToIgnore[i]) {
                            return $q.reject(response);
                        }
                    }

                    // The status code is in the failure range (4xx, 5xx) and isn't an ignored status code
                    // so increment the failure count and check against the failure limit
                    circuit.failureCount += 1;
                    if (circuit.failureCount >= circuit.failureLimit) {
                        // Breached failure limit, set the circuit to OPEN state
                        circuit.STATE = STATE_OPEN;
                        // Create a timeout that will set the circuit to half open based upon the half open time specified by the circuit
                        $timeout(function () {
                            circuit.STATE = STATE_HALF_OPEN;
                        }, circuit.timeUntilHalfOpen);
                    }
                }
                // return the response back to the client for handling
                return $q.reject(response);
            }
        };
    }]);
}).call(this);