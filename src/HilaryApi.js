(function (register) {
    'use strict';

    var ASYNC = 'polyn::async',
        BOOTSTRAPPER = 'hilary::bootstrapper',
        CONTEXT = 'hilary::context',
        ERROR_HANDLER = 'hilary::error-handler',
        IMMUTABLE = 'polyn::Immutable',
        IS = 'polyn::is',
        PARENT = 'hilary::parent',
        REGISTRATION_BLACK_LIST = {};

    REGISTRATION_BLACK_LIST[ASYNC] = true;
    REGISTRATION_BLACK_LIST[BOOTSTRAPPER] = true;
    REGISTRATION_BLACK_LIST[CONTEXT] = true;
    REGISTRATION_BLACK_LIST[IMMUTABLE] = true;
    REGISTRATION_BLACK_LIST[IS] = true;
    REGISTRATION_BLACK_LIST[PARENT] = true;

    register({
        name: 'HilaryApi',
        factory: HilaryApi
    });

    function HilaryApi (async, is, id, Immutable, locale, Logger, Context, HilaryModule) {
        var Api,
            scopes = {};

        /*
        // The Hilary constructor
        // @param options (string or Object): a named scope, or multiple options
        // @param options.name (string): a named scope
        //
        // @returns new Hilary scope with parent set to this (the current Hilary scope)
        */
        Api = function (options) {
            var self = {},
                config = new Config(options),
                logger = new Logger(options),
                context,
                onError,
                errorHandler;

            context = new Context(config);

            setReadOnlyProperty(self, '__isHilaryScope', true);
            setReadOnlyProperty(self, 'register', register);
            setReadOnlyProperty(self, 'autoRegister', register); // x-compatibility with hilary
            setReadOnlyProperty(self, 'resolve', resolve);
            setReadOnlyProperty(self, 'exists', exists);
            setReadOnlyProperty(self, 'dispose', dispose);
            setReadOnlyProperty(self, 'createChildContainer', createChildContainer);
            setReadOnlyProperty(self, 'setParentContainer', setParentContainer);
            setReadOnlyProperty(self, 'Bootstrapper', Bootstrapper);
            setReadOnlyProperty(self, 'context', context);

            if (config.name) {
                scopes[config.name] = self;
            }

            /*
            // register a module by name, an array of modules
            // @param definition (object): the module defintion: at least the name and factory properties are required
            // @param next (function): optional async API
            // @returns this (the Hilary scope)
            */
            function register (moduleOrArray, callback) {
                var err = new Error(locale.api.REGISTER_ERR);

                if (is.object(moduleOrArray)) {
                    // this is a single module
                    return registerOne(moduleOrArray, err, callback);
                } else if (is.array(moduleOrArray)) {
                    // this is an array of modules
                    return optionalAsync(function () {
                        moduleOrArray.forEach(registerOne);
                        return self;
                    }, err, callback);
                } else {
                    var exc = new Exception({
                        type: locale.errorTypes.INVALID_ARG,
                        error: new Error(locale.api.REGISTER_ARG + JSON.stringify(moduleOrArray)),
                        data: moduleOrArray
                    });

                    onError(exc);
                    return exc;
                }
            }

            /*
            // register a module by name
            // @param definition (object): the module defintion: at least the name and factory properties are required
            // @param next (function): optional async API
            // @returns this (the Hilary scope)
            */
            function registerOne (input, err, callback) {
                var tasks = [];

                tasks.push(function bind (next) {
                    var hilaryModule = new HilaryModule(input);

                    if (hilaryModule.isException) {
                        next(new Exception({
                            type: locale.errorTypes.INVALID_ARG,
                            error: new Error(hilaryModule.error.message),
                            messages: hilaryModule.messages
                        }));
                    } else {
                        next(null, hilaryModule);
                    }
                });

                tasks.push(function validate (hilaryModule, next) {
                    if (REGISTRATION_BLACK_LIST[hilaryModule.name]) {
                        next(new Exception({
                            type: locale.errorTypes.INVALID_ARG,
                            error: new Error(locale.api.REGISTRATION_BLACK_LIST + hilaryModule.name)
                        }));
                    }

                    next(hilaryModule);
                });

                tasks.push(function optionallyResetErrorHandler (hilaryModule, next) {
                    if (hilaryModule.name === ERROR_HANDLER) {
                        errorHandler = null;
                    }

                    next(hilaryModule);
                });

                tasks.push(function addToContainer (hilaryModule, next) {
                    context.container.register(hilaryModule);

                    if (hilaryModule.singleton) {
                        context.singletonContainer.register(hilaryModule);
                    }

                    next(null, hilaryModule);
                });

                if (is.function(callback)) {

                    async.waterfall(tasks, function (err, results) {
                        if (err) {
                            onError(err);
                        }

                        callback(err, results);
                    });
                } else {
                    var output;

                    async.waterfall(tasks, { blocking: true }, function (err, result) {
                        if (err) {
                            onError(err);
                        }

                        output = err || result;
                    });

                    return output;
                }
            }

            /*
            // attempt to resolve a dependency by name (supports parental hierarchy)
            // @param moduleName (string): the qualified name that the module can be located by in the container
            // @returns the module that is being resolved
            */
            function resolve (moduleName, callback) {
                return resolveOne(moduleName, moduleName, callback);
            }

            function resolveOne (moduleName, relyingModuleName, callback) {
                var ctx = {
                        context: context,
                        config: config,
                        name: moduleName,
                        relyingName: relyingModuleName
                    },
                    tasks = [];

                tasks.push(function (next) {
                    next(null, ctx);
                });

                tasks.push(function validateModuleName (ctx, next) {
                    if (is.string(ctx.name)) {
                        next(null, ctx);
                    } else {
                        next(new Exception({
                            type: locale.errorTypes.INVALID_ARG,
                            error: new Error(locale.api.RESOLVE_ARG + JSON.stringify(ctx.name))
                        }));
                    }
                });

                tasks.push(function findModule (ctx, next) {
                    if (ctx.context.singletonContainer.exists(ctx.name)) {
                        ctx.resolved = context.singletonContainer.resolve(ctx.name);
                        ctx.isResolved = true;
                        ctx.registerSingleton = false;
                        next(null, ctx);
                    } else if (context.container.exists(ctx.name)) {
                        ctx.theModule = context.container.resolve(ctx.name);
                        next(null, ctx);
                    } else {
                        next(new Exception({
                            type: locale.errorTypes.MODULE_NOT_FOUND,
                            error: new Error(locale.api.RESOLVE_ARG),
                            data: {
                                moduleName: ctx.name,
                                relyingModuleName: ctx.relyingName
                            }
                        }));
                    }
                });

                tasks.push(function resolveDependencies (ctx, next) {
                    var tasks;

                    if (ctx.isResolved) {
                        // this was a singleton that has been resolved before
                        return next(null, ctx);
                    } else if (is.array(ctx.theModule.dependencies) && ctx.theModule.dependencies.length > 0) {
                        tasks = ctx.theModule.dependencies.map(function (item) {
                            return function (dependencies, relyingModuleName, cb) {
                                var dependency = resolveOne(item, relyingModuleName);

                                if (dependency.isException) {
                                    // short circuit
                                    return cb(dependency);
                                }

                                dependencies.push(dependency);
                                cb(null, dependencies, relyingModuleName);
                            };
                        });

                        tasks.unshift(function (cb) {
                            cb(null, [], ctx.relyingName);
                        });

                        return async.waterfall(tasks, function (err, dependencies) {
                            if (err) {
                                return next(err);
                            }

                            ctx.resolved = ctx.theModule.factory.apply(null, dependencies);
                            ctx.registerSingleton = ctx.theModule.singleton;
                            ctx.isResolved = true;

                            next(null, ctx);
                        });
                    } else if (is.function(ctx.theModule.factory) && ctx.theModule.factory.length === 0) {
                        // the module is a function and takes no arguments, return the result of executing it
                        ctx.resolved = ctx.theModule.factory.call();
                    } else {
                        // the module takes arguments and has no dependencies, this must be a factory
                        ctx.resolved = ctx.theModule.factory;
                    }

                    ctx.registerSingleton = ctx.theModule.singleton;
                    ctx.isResolved = true;
                    next(null, ctx);
                });

                tasks.push(function optionallyRegisterSingleton (ctx, next) {
                    if (ctx.registerSingleton) {
                        context.singletonContainer.register({
                            name: ctx.name,
                            factory: ctx.resolved
                        });
                    }

                    next(null, ctx);
                });

                tasks.push(function warnOnUndefined (ctx, next) {
                    if (typeof ctx.resolved === 'undefined') {
                        ctx.config.onResolveUndefined(locale.api.MODULE_UNDEFINED + ctx.name);
                    }

                    next(null, ctx);
                });

                tasks.push(function bindToOutput (ctx, next) {
                    next(null, ctx.resolved);
                });

                // RUN the waterfall
                if (is.function(callback)) {
                    async.waterfall(tasks, function (err, results) {
                        if (
                            err &&
                            err.type === locale.errorTypes.MODULE_NOT_FOUND &&
                            context.parent
                        ) {
                            return scopes[context.parent].resolveOne(moduleName, relyingModuleName, callback);
                        } else if (err) {
                            onError(err);
                        }

                        callback(err, results);
                    });
                } else {
                    var output;

                    async.waterfall(tasks, { blocking: true }, function (err, result) {
                        if (
                            err &&
                            err.type === locale.errorTypes.MODULE_NOT_FOUND &&
                            context.parent
                        ) {
                            return scopes[context.parent].resolveOne(moduleName, relyingModuleName);
                        } else if (err) {
                            onError(err);
                        }

                        output = err || result;
                    });

                    return output;
                }
            }

            /*
            // Checks to see if a module exists and returns a boolean result
            // @param moduleName (string): the qualified name that the module can be located by in the container
            // @returns true if the module exists, otherwise false
            */
            function exists (moduleName) {
                return context.container.exists(moduleName);
            }

            /*
            // Disposes a module, or all modules. When a moduleName is not passed
            // as an argument, the entire container is disposed.
            // @param moduleName (string): The name of the module to dispose
            // @returns boolean: true if the object(s) were disposed, otherwise false
            */
            function dispose (moduleName, callback) {
                return optionalAsync(function () {
                    return context.container.dispose(moduleName) &&
                        context.singletonContainer.dispose(moduleName);
                }, callback);
            }

            /*
            // exposes the constructor for hilary so you can create child contexts
            // @param options.name (string): a named scope
            //
            // @returns new Hilary scope with parent set to this (the current Hilary scope)
            */
            function createChildContainer (childOptions, callback) {
                return optionalAsync(function () {
                    childOptions = childOptions || {};
                    childOptions.parentContainer = self;

                    return new Api(childOptions);
                }, callback);
            }

            /*
            // allows you to set a scopes parent container explicitly
            // @param options.utils (object): utilities to use for validation (i.e. isFunction)
            // @param options.exceptions (object): exception handling
            //
            // @returns new Hilary scope with parent set to this (the current Hilary scope)
            */
            function setParentContainer (scope) {
                if (is.string(scope)) {
                    context = context.setParentContainer(scope);
                    return context;
                } else if (scope.__isHilaryScope) {
                    context = context.setParentContainer(scope.context.scope);
                    return context;
                } else {
                    return new Exception({
                        type: locale.errorTypes.INVALID_ARG,
                        error: new Error(locale.api.PARENT_CONTAINER_ARG)
                    });
                }
            }

            function Bootstrapper (bootstrapper, callback) {
                var tasks = [], done;
                bootstrapper = bootstrapper || {};

                if (is.function(bootstrapper.onComposed)) {
                    done = bootstrapper.onComposed;
                } else if (is.function(callback)) {
                    done = callback;
                } else {
                    done = function (err) {
                        if (err) {
                            logger.fatal(err);
                        }
                    };
                }

                tasks.push(function start (next) {
                    next(null, self);
                });

                if (is.function(bootstrapper.composeModules)) {
                    tasks.push(bootstrapper.composeModules);
                }

                async.waterfall(tasks, done);
            }

            function resolveErrorHandler () {
                var tempHandler;

                if (errorHandler) {
                    return errorHandler;
                }

                try {
                    tempHandler = self.resolve(ERROR_HANDLER);

                    if (tempHandler && is.function(tempHandler.throw)) {
                        errorHandler = tempHandler;
                    } else {
                        errorHandler = {
                            throw: function (exception) {
                                logger.error(exception);
                            }
                        };
                    }
                } catch (e) {
                    logger.warn(e);
                }
            }

            /*
            // Default error handler. This can be overriden)
            */
            onError = function (err) {
                var exception;

                if (err.isException) {
                    exception = err;
                } else {
                    exception = new Exception({
                        type: 'UNKNOWN',
                        error: err
                    });
                }

                resolveErrorHandler().throw(exception);
            };

            function optionalAsync(func, err, callback) {
                if (is.function(callback)) {
                    async.runAsync(function () {
                        try {
                            callback(null, func());
                        } catch (e) {
                            err.message += '(' + e.message + ')';
                            err.cause = e;
                            onError(err);
                            callback(err);
                        }
                    });
                } else {
                    try {
                        return func();
                    } catch (e) {
                        err.message += '(' + e.message + ')';
                        err.cause = e;
                        onError(err);
                        callback(err);
                    }
                }
            }

            // REGISTER Default Modules
            self.register({ name: ASYNC,        factory: async });
            self.register({ name: CONTEXT,      singleton: false, factory: function () { return context; } });
            self.register({ name: IMMUTABLE,    factory: Immutable });
            self.register({ name: IS,           factory: is });
            self.register({ name: PARENT,       factory: function () { return context.parent; } });

            return self;
        }; // /Api

        Api.scope = function (options) {
            return new Api(options);
        };

        function Config (options) {
            var self = is.object(options) ? options : {};

            if (is.string(options)) {
                self.name = options;
            } else if (!options || is.nullOrUndefined(options.name)) {
                self.name = id.createUid(8);
            }

            if (options && is.function(options.onResolveUndefined)) {
                self.onResolveUndefined = options.onResolveUndefined;
            } else {
                self.onResolveUndefined = console.log;
            }

            return self;
        }
    }

    function setReadOnlyProperty (obj, name, value) {
        Object.defineProperty(obj, name, {
          enumerable: false,
          configurable: false,
          writable: false,
          value: value
        });
    }

    function Exception (input) {
        return {
            isException: true,
            type: input.type,
            error: input.error,
            messages: input.messages || [],
            data: input.data
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
