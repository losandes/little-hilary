(function (register) {
    'use strict';

    register({
        name: 'Container',
        factory: Container
    });

    function Container (locale, is, Immutable, Exception) {
        return function (options) {
            var container = {}, self;
            options = options || {};

            self = {
                get: get,
                register: register,
                resolve: options.makeResolveHandler ?
                    /*@Override*/ options.makeResolveHandler(resolve) :
                    resolve,
                exists: exists,
                enumerate: enumerate,
                dispose: dispose,
                disposeOne: disposeOne
            };

            /*
            // provides direct access to the underlying container object
            */
            function get () {
                return container;
            }

            /*
            // Registers a module in the application lifetime
            // @param hilaryModule: the module that should be registered
            */
            function register (hilaryModule) {
                container[hilaryModule.name] = hilaryModule;
            }

            /*
            // Returns a module from this lifetime, if it exists
            */
            function resolve (name) {
                return container[name];
            }

            /*
            // Checks to see if a module is registered by this name
            */
            function exists (name) {
                return container.hasOwnProperty(name);
            }

            /*
            // Enumerates all of the objects in the container, passing
            // each key and value to a consumer function
            */
            function enumerate (consumer) {
                var prop;

                if (!is.function(consumer)) {
                    return new Exception({
                        type: locale.errorTypes.INVALID_ARG,
                        error: new Error(locale.container.CONSUMER_REQUIRED)
                    });
                }

                for (prop in container) {
                    if (container.hasOwnProperty(prop)) {
                        consumer(prop, container[prop]);
                    }
                }
            }

            function dispose (moduleName) {
                var key, i, result;

                if (is.string(moduleName)) {
                    return self.disposeOne(moduleName);
                } else if (is.array(moduleName)) {
                    result = true;

                    for (i = 0; i < moduleName.length; i += 1) {
                        result = result && self.disposeOne(moduleName[i]);
                    }

                    return result;
                } else if (!moduleName) {
                    result = true;

                    for (key in container) {
                        if (container.hasOwnProperty(key)) {
                            result = result && self.disposeOne(key);
                        }
                    }

                    return result;
                } else {
                    return false;
                }
            }

            function disposeOne (moduleName) {
                if (container[moduleName]) {
                    delete container[moduleName];
                    return true;
                } else {
                    return false;
                }
            }

            return self;
        };
    }

}(function (registration) {
    'use strict';

    try {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== 'undefined') {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error('[HILARY] Unkown runtime environment');
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : 'MISSING NAME';
        var err = new Error('[HILARY] Registration failure: ' + name);
        err.cause = e;
        throw err;
    }
}));
