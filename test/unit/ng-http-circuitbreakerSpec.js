/**
 * Created by HPugh on 10/31/13.
 */

describe('ng-http-circuitbreaker > ', function() {

    describe('circuit provider > ', function() {

        beforeEach(module('ng-http-circuitbreaker', function($provide, $httpProvider, ngHttpCircuitBreakerConfigProvider) {
            $provide.provider('ngHttpCircuitBreakerConfig', ngHttpCircuitBreakerConfigProvider);
            $provide.provider('$http', $httpProvider);
        }));

        it('should inject ngHttpCircuitBreakerConfig with default setup', inject(function(ngHttpCircuitBreakerConfig) {
            expect(ngHttpCircuitBreakerConfig.circuits).toBeDefined();
            expect(ngHttpCircuitBreakerConfig.circuits.length).toBe(0);

        }));

        //endPointRegEx, failureLimit, responseSLA, timeUntilHalfOpen, statusCodesToIgnore

        it('should allow single circuit definition', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000, statusCodesToIgnore: [401,403,409]});
            });
            inject(function(ngHttpCircuitBreakerConfig) {
                expect(ngHttpCircuitBreakerConfig.circuits).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits.length).toBe(1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].failureLimit).toBe(5);
                expect(ngHttpCircuitBreakerConfig.circuits[0].STATE).toBe(0);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(401);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(403);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(409);
            });


        });

        it('should allow multiple circuit definitions', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000, statusCodesToIgnore: [401,403,409]})
                    .circuit({endPointRegEx: /^\/api2\//i, failureLimit: 10, responseSLA: 1000, timeUntilHalfOpen: 7500, statusCodesToIgnore: [401,403]});
            });
            inject(function(ngHttpCircuitBreakerConfig) {
                expect(ngHttpCircuitBreakerConfig.circuits).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits.length).toBe(2);
                expect(ngHttpCircuitBreakerConfig.circuits[0].failureLimit).toBe(5);
                expect(ngHttpCircuitBreakerConfig.circuits[0].STATE).toBe(0);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(401);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(403);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(409);
                expect(ngHttpCircuitBreakerConfig.circuits[1].failureLimit).toBe(10);
                expect(ngHttpCircuitBreakerConfig.circuits[1].STATE).toBe(0);
                expect(ngHttpCircuitBreakerConfig.circuits[1].statusCodesToIgnore).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits[1].statusCodesToIgnore).toContain(401);
                expect(ngHttpCircuitBreakerConfig.circuits[1].statusCodesToIgnore).toContain(403);
                expect(ngHttpCircuitBreakerConfig.circuits[1].statusCodesToIgnore).toNotContain(409);
            });


        });

        it('should provide default status codes to ignore', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000});
            });
            inject(function(ngHttpCircuitBreakerConfig) {
                expect(ngHttpCircuitBreakerConfig.circuits).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits.length).toBe(1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].failureLimit).toBe(5);
                expect(ngHttpCircuitBreakerConfig.circuits[0].STATE).toBe(0);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(401);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(403);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toContain(409);
            });


        });

        it('should allow explicit listening for all status codes', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000, statusCodesToIgnore: []});
            });
            inject(function(ngHttpCircuitBreakerConfig) {
                expect(ngHttpCircuitBreakerConfig.circuits).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits.length).toBe(1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].failureLimit).toBe(5);
                expect(ngHttpCircuitBreakerConfig.circuits[0].STATE).toBe(0);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore).toBeDefined();
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.length).toBe(0);
            });

        });

        it('should require status codes to ignore be an array', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, statusCodesToIgnore: 401})).toThrow('Invalid statusCodesToIgnore - expecting array of integer values representing HTTP response codes');
            });
        });

        it('should not allow a zero failure limit', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 0, responseSLA: 500, timeUntilHalfOpen:5000, statusCodesToIgnore: []})).toThrow('Invalid failure limit - must be positive, non-zero value');
            });
        });

        it('should not allow a negative failure limit', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: -1, responseSLA: 500, timeUntilHalfOpen:5000, statusCodesToIgnore: []})).toThrow('Invalid failure limit - must be positive, non-zero value');
            });
        });

        it('should not allow a non-numeric failure limit', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 'bad'})).toThrow('Invalid failure limit - must be positive, non-zero value');
            });
        });

        it('should not allow a negative response sla', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, responseSLA: -250})).toThrow('Invalid Response SLA - must be non-negative. Set to 0 if you do not want a response sla to be set.');
            });
        });

        it('should not allow a non-numeric response sla', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, responseSLA: 'bad'})).toThrow('Invalid Response SLA - must be non-negative. Set to 0 if you do not want a response sla to be set.');
            });
        });

        it('should allow user to explicitly bypass response SLAs', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, responseSLA: 0});
            });
            inject(function(ngHttpCircuitBreakerConfig) {
                expect(ngHttpCircuitBreakerConfig.circuits[0].failureLimit).toBe(5);
                expect(ngHttpCircuitBreakerConfig.circuits[0].responseSLA).toBe(0);
                expect(ngHttpCircuitBreakerConfig.circuits[0].timeUntilHalfOpen).toBe(5000);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.length).toBe(3);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.indexOf(401)).not.toBe(-1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.indexOf(403)).not.toBe(-1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.indexOf(409)).not.toBe(-1);
            });
        });

        it('should not allow a negative time until half open', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, timeUntilHalfOpen: -5000})).toThrow('Invalid Circuit timeUntilHalfOpen - must be a positive non-zero integer value');
            });
        });

        it('should not allow a non-numeric time until half open', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, timeUntilHalfOpen: 'bad'})).toThrow('Invalid Circuit timeUntilHalfOpen - must be a positive non-zero integer value');
            });
        });

        it('should not allow a zero time until half open', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, timeUntilHalfOpen: 0})).toThrow('Invalid Circuit timeUntilHalfOpen - must be a positive non-zero integer value');
            });
        });

        it('should provide default values for all configs except for endpoint', function() {
           module(function(ngHttpCircuitBreakerConfigProvider) {
               ngHttpCircuitBreakerConfigProvider
                   .circuit({endPointRegEx: /^\/api\//i});
           });

            inject(function(ngHttpCircuitBreakerConfig) {
                expect(ngHttpCircuitBreakerConfig.circuits[0].failureLimit).toBe(5);
                expect(ngHttpCircuitBreakerConfig.circuits[0].responseSLA).toBe(500);
                expect(ngHttpCircuitBreakerConfig.circuits[0].timeUntilHalfOpen).toBe(5000);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.length).toBe(3);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.indexOf(401)).not.toBe(-1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.indexOf(403)).not.toBe(-1);
                expect(ngHttpCircuitBreakerConfig.circuits[0].statusCodesToIgnore.indexOf(409)).not.toBe(-1);
            });
        });

        it('should not allow identical circuit endpoints', function() {
            module(function(ngHttpCircuitBreakerConfigProvider) {
                expect(ngHttpCircuitBreakerConfigProvider
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000, statusCodesToIgnore: [401,403,409]})
                    .circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000, statusCodesToIgnore: [401,403,409]})
                ).toThrow('Duplicate endpoint regular expression found');
            });
        })

    });

    describe('circuit breaker > ', function() {

        var $http,
            $httpBackend,
            $rootScope,
            $timeout,
            cktConfig,
            ckt;

        var stableSpy = {
            success: function() {},
            failure: function() {},
            then: function() {}
        };

        var unstableSpy = {
            success: function() {},
            failure: function() {},
            then: function() {}
        }

        var createFailedHttpCalls = function createFailedHttpCalls(n) {
            for(var i = 0; i < n; i++) {
                $http.get('/api/unstable')
                    .success(unstableSpy.success)
                    .error(unstableSpy.failure);
            }
        };

        var createSuccessfulHttpCalls = function createSuccessfulHttpCalls(n) {
            for(var i = 0; i < n; i++) {
                $http.get('/api/stable')
                    .success(stableSpy.success)
                    .error(stableSpy.failure);
            }
        };

        var createAuthHttpCalls = function createAuthHttpCalls(n) {
            for(var i = 0; i < n; i++) {
                $http.get('/api/auth')
                    .success(stableSpy.success)
                    .error(stableSpy.failure);
            }
        };



        beforeEach(module('ng-http-circuitbreaker', function($provide, ngHttpCircuitBreakerConfigProvider) {
            $provide.provider('ngHttpCircuitBreakerConfig', ngHttpCircuitBreakerConfigProvider);
            //$provide.provider('$http', $httpProvider);
        }));
        beforeEach(
            module(function(ngHttpCircuitBreakerConfigProvider, $httpProvider) {
                ngHttpCircuitBreakerConfigProvider.circuit({endPointRegEx: /^\/api\//i, failureLimit: 5, responseSLA: 500, timeUntilHalfOpen: 5000, statusCodesToIgnore: [401,403,409]});
                $httpProvider.interceptors.push('ngHttpCircuitBreaker');
        }));

        beforeEach(inject(function($injector) {

            // angular services & mocks
            $http = $injector.get('$http');
            $rootScope = $injector.get('$rootScope');
            $timeout = $injector.get('$timeout');

            // circuit breaker objects
            cktConfig = $injector.get('ngHttpCircuitBreakerConfig');
            ckt = $injector.get('ngHttpCircuitBreaker');

            // setup spies to monitor promise behavior
            spyOn(unstableSpy, 'success');
            spyOn(unstableSpy, 'failure');
            spyOn(unstableSpy, 'then');
            spyOn(stableSpy, 'success');
            spyOn(stableSpy, 'failure');
            spyOn(stableSpy, 'then');

            // we also want to spy on the response interceptors and validate proper calling
            spyOn(ckt, 'responseError').andCallThrough();
            spyOn(ckt, 'response').andCallThrough();
            spyOn(ckt, 'request').andCallThrough();
        }));

        beforeEach(inject(function(_$httpBackend_) {
            $httpBackend = _$httpBackend_;
            $httpBackend.whenGET('/api/unstable').respond(function() {
                return [500, 'App Error'];
            });
            $httpBackend.whenGET('/ApI/uNsTAbLe').respond(function() {
                return [500, 'App Error'];
            });
            $httpBackend.whenGET('/api/stable').respond(function() {
                return [200, 'OK'];
            });
            $httpBackend.whenGET('/api/auth').respond(function() {
                return [401, 'Auth Required'];
            });
            $httpBackend.whenGET('/twitter/api').respond(function() {
                return [200, 'OK'];
            });
        }));

        it('should setup circuits', function() {
            expect(cktConfig).toBeDefined();
            expect(cktConfig.circuits).toBeDefined();
            expect(cktConfig.circuits.length).toBe(1);
        });

        it('should process a single failure', function() {
            createFailedHttpCalls(1);

            $httpBackend.flush();
            expect(cktConfig.circuits[0].failureCount).toBe(1);
            expect(unstableSpy.success).not.toHaveBeenCalled();
            expect(unstableSpy.failure).toHaveBeenCalled();
        });

        it('should not affect endpoints not covered by circuit', function() {
            var twitter = false;

            $http.get('/twitter/api')
                .success(function(data, status, headers, config) {
                    twitter = true;
                    expect(config).toBeDefined();
                    expect(config.cktbkr).toBeUndefined();
                })
                .error(unstableSpy.failure);
            $httpBackend.flush();

            expect(ckt.responseError).not.toHaveBeenCalled();
            expect(ckt.request).toHaveBeenCalled();
            expect(ckt.response).toHaveBeenCalled();

            expect(twitter).toBeTruthy();
            expect(unstableSpy.failure).not.toHaveBeenCalled();
        });

        it('should not trip circuit on responses with ignored status codes', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createAuthHttpCalls(5);
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            expect(cktConfig.circuits[0].STATE).toBe(0);
        });

        it('should process multiple failures safely', function() {

            createFailedHttpCalls(4);

            $httpBackend.flush();

            expect(ckt.response).not.toHaveBeenCalled();
            expect(unstableSpy.success).not.toHaveBeenCalled();
            expect(unstableSpy.failure).toHaveBeenCalled();

            expect(cktConfig.circuits[0].failureCount).toBe(4);
            expect(cktConfig.circuits[0].STATE).toBe(0);
        });

        it('successful calls should decrement failure counter', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);

            createFailedHttpCalls(4);
            $httpBackend.flush();

            expect(cktConfig.circuits[0].failureCount).toBe(4);

            createSuccessfulHttpCalls(1);

            $httpBackend.flush();
            expect(cktConfig.circuits[0].failureCount).toBe(3);
        });

        it('should not allow failure count to go negative', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);

            createSuccessfulHttpCalls(1);

            $httpBackend.flush();
            expect(cktConfig.circuits[0].failureCount).toBe(0);
        });

        it('excessive failures should trip the circuit breaker', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].failureCount).toBe(5);
            expect(cktConfig.circuits[0].STATE).toBe(2);
        });

        it('should trip the circuit breaker and fail fast', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            createSuccessfulHttpCalls(1);
            $rootScope.$digest(); // can't use $httpBackend.flush here
            expect(cktConfig.circuits[0].STATE).toBe(2);
            expect(stableSpy.failure).toHaveBeenCalled();
            expect(stableSpy.success).not.toHaveBeenCalled();
        });

        it('should move to half-open state', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2);
            $timeout.flush(); // circuit should now be in half-open state
            expect(cktConfig.circuits[0].STATE).toBe(1);
        });

        it('should allow a request through when half-open and close circuit on success', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2);
            $timeout.flush();
            // circuit should now be in half-open state
            expect(cktConfig.circuits[0].STATE).toBe(1);
            // next call through should pass through and succeed, CLOSING circuit
            createSuccessfulHttpCalls(1);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(0);
            expect(cktConfig.circuits[0].failureCount).toBe(0);
        });

        it('should allow a request through when half-open but leave circuit open on failure', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2);
            $timeout.flush(); // circuit should now be in half-open state
            expect(cktConfig.circuits[0].STATE).toBe(1);
            // next http call should fail, leaving circuit open
            createFailedHttpCalls(1);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2);
            expect(cktConfig.circuits[0].failureCount).toBe(6);
        });

        it('should move to half-open, fail and stay closed, and then moved to half-open again', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2); // circuit is now OPEN

            $timeout.flush(); // circuit should now be in half-open state
            expect(cktConfig.circuits[0].STATE).toBe(1);

            // next http call should fail, leaving circuit open
            createFailedHttpCalls(1);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2);
            expect(cktConfig.circuits[0].failureCount).toBe(6);
            expect(unstableSpy.failure).toHaveBeenCalled();

            $timeout.flush(); // should now be half-open again
            expect(cktConfig.circuits[0].STATE).toBe(1);
        });

        it('a closed circuit should not affect other circuits', function() {
            expect(cktConfig.circuits[0].failureCount).toBe(0);
            createFailedHttpCalls(5);
            $httpBackend.flush();
            expect(cktConfig.circuits[0].STATE).toBe(2);

            var twitter = false;

            $http.get('/twitter/api')
                .success(function(data, status, headers, config) {
                    twitter = true;
                    expect(config).toBeDefined();
                    expect(config.cktbkr).toBeUndefined();
                })
                .error(stableSpy.failure);
            $httpBackend.flush();

            // /api circuit should still be OPEN
            expect(cktConfig.circuits[0].STATE).toBe(2);
            expect(stableSpy.failure).not.toHaveBeenCalled();
            expect(twitter).toBeTruthy();
        });

        it('should not care about casing since circuit defined with case insensitive regex', function() {
            $http.get('/ApI/uNsTAbLe')
                .success(unstableSpy.success)
                .error(unstableSpy.failure);

            $httpBackend.flush();

            expect(cktConfig.circuits[0].STATE).toBe(0);
            expect(cktConfig.circuits[0].failureCount).toBe(1);
        });



    });
});

