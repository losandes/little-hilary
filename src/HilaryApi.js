(function (register) {
    'use strict';

    var ASYNC = 'polyn::async',
        CONTEXT = 'hilary::context',
        ERROR_HANDLER = 'hilary::error-handler',
        IMMUTABLE = 'polyn::Immutable',
        IS = 'polyn::is',
        PARENT = 'hilary::parent';

    register({
        name: 'HilaryApi',
        factory: HilaryApi
    });

    function HilaryApi (async, is, id, Immutable, locale, Logger, Exception, Context, HilaryModule) {
        var Api,
            scopes = {},
            defaultScope;

        /*
        // The Hilary constructor
        // @param options (string or Object): a named scope, or multiple options
        // @param options.name (string): a named scope
        //
        // @returns new Hilary scope with parent set to this (the current Hilary scope)
        */
        Api = function (options) {
            var self,
                logger = new Logger(options),
                config = new Config(options),
                context,
                onError,
                errorHandler;

            context = new Context(config);

            self = {
                register: register,
                resolve: resolve,
                exists: exists,
                dispose: dispose,
                bootstrap: bootstrap,
                scope: scope,
                setParentScope: setParentScope
            };

            setReadOnlyProperty(self, '__isHilaryScope', true);
            setReadOnlyProperty(self, 'context', context);

            scopes[config.scope] = self;

            // TODO: this is probably better done with a wrapper
            // if (config.hilaryCompatible) {
            //     // add hilaryjs compatible APIs
            //     self.autoRegister = register;
            //     self.Bootstrapper = bootstrap;
            // }



            /*
            // register a module by name, an array of modules
            // @param definition (object): the module defintion: at least the name and factory properties are required
            // @param next (function): optional async API
            // @returns this (the Hilary scope)
            */
            function register (moduleOrArray, callback) {
                var err = new Error(locale.api.REGISTER_ERR);

                if (is.object(moduleOrArray)) {
                    logger.trace('[TRACE] registering a single module:', moduleOrArray);
                    return registerOne(moduleOrArray, err, callback);
                } else if (is.array(moduleOrArray)) {
                    logger.trace('[TRACE] registering an array of modules:', moduleOrArray);
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

                    logger.trace('[TRACE] registration failed:', exc);
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
                        logger.trace('[TRACE] Invalid registration model:', hilaryModule);
                        return next(new Exception({
                            type: locale.errorTypes.INVALID_REGISTRATION,
                            error: new Error(hilaryModule.error.message),
                            messages: hilaryModule.messages,
                            data: input
                        }));
                    } else {
                        logger.trace('[TRACE] Successfully bound to HilaryModule:', hilaryModule.name);
                        return next(null, hilaryModule);
                    }
                });

                tasks.push(function optionallyResetErrorHandler (hilaryModule, next) {
                    if (hilaryModule.name === ERROR_HANDLER) {
                        logger.trace('[TRACE] Error handler reset');
                        errorHandler = null;
                    }

                    next(null, hilaryModule);
                });

                tasks.push(function addToContainer (hilaryModule, next) {
                    context.container.register(hilaryModule);
                    logger.trace('[TRACE] Module registered on container', hilaryModule.name);
                    next(null, hilaryModule);
                });

                if (is.function(callback)) {
                    return async.waterfall(tasks, function (err, hilaryModule) {
                        if (err) {
                            logger.trace('[TRACE] Registration failed:', input, err);
                            onError(err);
                            return callback(err);
                        }

                        logger.trace('[TRACE] Registration success:', hilaryModule.name);
                        callback(err, hilaryModule);
                    });
                } else {
                    var output;

                    async.waterfall(tasks, { blocking: true }, function (err, hilaryModule) {
                        if (err) {
                            logger.trace('[TRACE] Registration failed:', input, err);
                            output = err;
                            onError(err);
                            return;
                        }

                        logger.trace('[TRACE] Registration success:', hilaryModule.name);
                        output = hilaryModule;
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
                logger.trace('[TRACE] resolving:', moduleName);
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
                        logger.trace('[TRACE] module name is valid:', ctx.name);
                        next(null, ctx);
                    } else {
                        logger.trace('[TRACE] module name is INVALID:', ctx.name);
                        next(new Exception({
                            type: locale.errorTypes.INVALID_ARG,
                            error: new Error(locale.api.RESOLVE_ARG + JSON.stringify(ctx.name))
                        }));
                    }
                });

                tasks.push(function findModule (ctx, next) {
                    if (ctx.context.singletonContainer.exists(ctx.name)) {
                        logger.trace('[TRACE] found singleton for:', ctx.name);
                        ctx.resolved = context.singletonContainer
                            .resolve(ctx.name)
                            .factory;
                        ctx.isResolved = true;
                        ctx.registerSingleton = false;
                        next(null, ctx);
                    } else if (context.container.exists(ctx.name)) {
                        logger.trace('[TRACE] found factory for:', ctx.name);
                        ctx.theModule = context.container.resolve(ctx.name);
                        next(null, ctx);
                    } else {
                        logger.trace('[TRACE] module not found:', ctx.name);
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
                    var subTasks;
                    logger.trace('[TRACE] resolving dependencies for:', ctx.name);

                    if (ctx.isResolved) {
                        // this was a singleton that has been resolved before
                        return next(null, ctx);
                    } else if (is.array(ctx.theModule.dependencies) && ctx.theModule.dependencies.length > 0) {
                        logger.trace('[TRACE] resolving with dependencies array:', ctx.theModule.dependencies.join(', '));
                        subTasks = ctx.theModule.dependencies.map(function (item) {
                            return function (dependencies, relyingModuleName, cb) {
                                var dependency = resolve(item, relyingModuleName);

                                if (!dependency) {
                                    // short circuit
                                    logger.warn('[WARN] the following dependency was not resolved:', item);
                                    return cb(null, dependencies, relyingModuleName);
                                } else  if (dependency.isException) {
                                    // short circuit
                                    logger.trace('[TRACE] the following dependency returned an exception:', item);
                                    return cb(dependency);
                                }

                                logger.trace('[TRACE] the following dependency was resolved:', item);
                                dependencies.push(dependency);
                                cb(null, dependencies, relyingModuleName);
                            };
                        });

                        subTasks.unshift(function (cb) {
                            cb(null, [], ctx.relyingName);
                        });

                        return async.waterfall(subTasks, { blocking: true }, function (err, dependencies) {
                            if (err) {
                                logger.trace('[TRACE] at least one dependency was not found for:', ctx.name, err);
                                return next(err);
                            }

                            ctx.resolved = new (Function.prototype.bind.apply(ctx.theModule.factory, [null].concat(dependencies)))();
                            ctx.registerSingleton = ctx.theModule.singleton;
                            ctx.isResolved = true;

                            logger.trace('[TRACE] dependencies resolved for:', ctx.name);
                            next(null, ctx);
                        });
                    } else if (is.function(ctx.theModule.factory) && ctx.theModule.factory.length === 0) {
                        logger.trace('[TRACE] the factory is a function and takes no arguments, returning the result of executing it:', ctx.name);
                        ctx.resolved = new (Function.prototype.bind.apply(ctx.theModule.factory, [null]))();
                    } else {
                        // the module takes arguments and has no dependencies, this must be a factory
                        logger.trace('[TRACE] the factory takes arguments and has no dependencies, returning the function as-is:', ctx.name);
                        ctx.resolved = ctx.theModule.factory;
                    }

                    ctx.registerSingleton = ctx.theModule.singleton;
                    ctx.isResolved = true;
                    next(null, ctx);
                });

                tasks.push(function optionallyRegisterSingleton (ctx, next) {
                    if (ctx.registerSingleton) {
                        logger.trace('[TRACE] registering the resolved module as a singleton: ', ctx.name);
                        context.singletonContainer.register({
                            name: ctx.name,
                            factory: ctx.resolved
                        });
                    }

                    next(null, ctx);
                });

                tasks.push(function bindToOutput (ctx, next) {
                    logger.trace('[TRACE] binding the module to the output:', ctx.name);
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
                            logger.trace('[TRACE] attempting to resolve the module, ' + ctx.name + ', on the parent scope:', context.parent);
                            return scopes[context.parent].resolve(moduleName, callback);
                        } else if (err && err.type === locale.errorTypes.MODULE_NOT_FOUND) {
                            logger.trace('[TRACE] attempting to gracefully degrade, ' + ctx.name);
                            var result = gracefullyDegrade(ctx.name);

                            if (result) {
                                return callback(null, result);
                            }
                        }

                        if (err) {
                            logger.trace('[TRACE] resolve failed for:', ctx.name, err);
                            onError(err);
                            return callback(err);
                        }

                        logger.trace('[TRACE] module resolved:', ctx.name);
                        callback(null, results);
                    });
                } else {
                    var output;

                    async.waterfall(tasks, { blocking: true }, function (err, results) {
                        if (
                            err &&
                            err.type === locale.errorTypes.MODULE_NOT_FOUND &&
                            context.parent
                        ) {
                            logger.trace('[TRACE] attempting to resolve the module, ' + ctx.name + ', on the parent scope:', context.parent);
                            output = scopes[context.parent].resolve(moduleName);
                            return;
                        } else if (err && err.type === locale.errorTypes.MODULE_NOT_FOUND) {
                            logger.trace('[TRACE] attempting to gracefully degrade, ' + ctx.name);
                            var result = gracefullyDegrade(ctx.name);

                            if (result) {
                                output = result;
                                return;
                            }
                        }

                        if (err) {
                            logger.trace('[TRACE] resolve failed for:', ctx.name, err);
                            onError(err);
                            output = err;
                            return;
                        }

                        logger.trace('[TRACE] module resolved:', ctx.name);
                        output = results;
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
                logger.trace('[TRACE] checking if module exists:', moduleName);
                return context.container.exists(moduleName);
            }

            /*
            // Disposes a module, or all modules. When a moduleName is not passed
            // as an argument, the entire container is disposed.
            // @param moduleName (string): The name of the module to dispose
            // @returns boolean: true if the object(s) were disposed, otherwise false
            */
            function dispose (moduleName, callback) {
                logger.trace('[TRACE] disposing module(s):', moduleName);
                return optionalAsync(function () {
                    return context.container.dispose(moduleName) &&
                        context.singletonContainer.dispose(moduleName);
                }, callback);
            }

            /*
            // exposes the constructor for hilary so you can create
            // new scopes, and child scopes
            // @param options.name (string): a named scope
            //
            // @returns new Hilary scope with parent set to this (the current Hilary scope)
            */
            function scope (name, options, callback) {
                name = name || id.createUid(8);
                options = options || {};
                options.parent = getScopeName(options.parent || self);

                if (scopes[name]) {
                    logger.trace('[TRACE] returning existing scope:', name);
                } else {
                    logger.trace('[TRACE] creating new scope:', name, options);
                }

                return optionalAsync(function () {
                    return Api.scope(name, options);
                }, new Error(), callback);
            }

            /*
            // allows you to set a scopes parent container explicitly
            // @param options.utils (object): utilities to use for validation (i.e. isFunction)
            // @param options.exceptions (object): exception handling
            //
            // @returns new Hilary scope with parent set to this (the current Hilary scope)
            */
            function setParentScope (scope) {
                var name = getScopeName(scope);

                if (!name) {
                    logger.trace('[TRACE] unable to set the parent scope of, ' + self.context.scope + ', to:', name);
                    return new Exception({
                        type: locale.errorTypes.INVALID_ARG,
                        error: new Error(locale.api.PARENT_CONTAINER_ARG)
                    });
                }

                logger.trace('[TRACE] setting the parent scope of, ' + self.context.scope + ', to:', name);
                context = context.setParentScope(name);
                return context;
            }

            function getScopeName (scope) {
                if (!scope) {
                    return null;
                } else if (is.string(scope)) {
                    return scope;
                } else if (scope.__isHilaryScope) {
                    return scope.context.scope;
                } else {
                    return null;
                }
            }

            function bootstrap (startup, callback) {
                var tasks = [], done;
                startup = startup || {};

                if (is.function(startup.onComposed)) {
                    logger.trace('[TRACE] using onComposed as the callback for the bootstrapper (ignores the callback argument) for:', self.context.scope);
                    done = startup.onComposed;
                } else if (is.function(callback)) {
                    logger.trace('[TRACE] using the callback argument for the bootstrapper for:', self.context.scope);
                    done = callback;
                } else {
                    logger.trace('[TRACE] a callback was not defined for the bootstrapper for:', self.context.scope);
                    done = function (err) {
                        if (err) {
                            logger.fatal(err);
                        }
                    };
                }

                tasks.push(function start (next) {
                    next(null, self);
                });

                if (is.function(startup.composeModules)) {
                    logger.trace('[TRACE] composing modules for:', self.context.scope);
                    tasks.push(startup.composeModules);
                }

                async.waterfall(tasks, done);
            }

            function resolveErrorHandler () {
                return {
                    throw: function (exception) {
                        logger.error(exception);
                    }
                };


// TODO

                var tempHandler;

                if (errorHandler) {
                    return errorHandler;
                }

                try {
                    tempHandler = self.resolve(ERROR_HANDLER);

                    if (tempHandler && is.function(tempHandler.throw)) {
                        logger.trace('[TRACE] using custom error handler for:', self.context.scope);
                        errorHandler = tempHandler;
                    } else {
                        logger.trace('[TRACE] using default error handler for:', self.context.scope);
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
                async.runAsync(function () {
// TODO
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
                }, true);
            };

            function optionalAsync(func, err, callback) {
                if (is.function(callback)) {
                    async.runAsync(function () {
                        var result = tryWith(func, err);

                        if (result.isException) {
                            callback(err);
                        } else {
                            callback(null, result);
                        }
                    });
                } else {
                    return tryWith(func, err);
                }
            }

            function tryWith(func, err) {
                try {
                    return func();
                } catch (e) {
                    err.message += '(' + e.message + ')';
                    err.cause = e;
                    onError(err);
                    return {
                        err: err,
                        isException: true
                    };
                }
            }

            function Config (options) {
                var self = {};
                options = options || {};

                if (is.string(options)) {
                    self.scope = options;
                } else if (is.nullOrUndefined(options.scope)) {
                    if (is.string(options.name)) {
                        self.scope = options.name;
                    } else {
                        self.scope = id.createUid(8);
                    }
                }

                self.logging = options.logging || { level: 30 };

                if (is.string(options.parent)) {
                    self.parent = options.parent;
                } else if (options.parent && options.parent.__isHilaryScope) {
                    self.parent = options.parent.context.scope;
                }

                return self;
            } // /Config

            return self;
        }; // /Api

        Api.scope = function (name, options) {
            if (scopes[name]) {
                return scopes[name];
            } else {
                options = options || {};
                options.name = name;
                scopes[name] = new Api(options);
                return scopes[name];
            }
        };

        defaultScope = Api.scope('default');

        // REGISTER Default Modules
// TODO: should these be on the container, as well, since that is normal behavior?
        defaultScope.context.singletonContainer.register({ name: ASYNC,        factory: async });
        defaultScope.context.singletonContainer.register({ name: CONTEXT,      singleton: false, factory: function () { return defaultScope.context; } });
        defaultScope.context.singletonContainer.register({ name: IMMUTABLE,    factory: Immutable });
        defaultScope.context.singletonContainer.register({ name: IS,           factory: is });
        defaultScope.context.singletonContainer.register({ name: PARENT,       factory: function () { return defaultScope.context.parent; } });

        return defaultScope;
    } // /Api

    function setReadOnlyProperty (obj, name, value) {
        Object.defineProperty(obj, name, {
          enumerable: false,
          configurable: false,
          get: function () {
              return value;
          },
          set: function () {
              console.log(name + ' is read only');
          }
        });
    }

    function gracefullyDegrade (moduleName) {
        if (typeof module !== 'undefined' && module.exports && require) {
            // attempt to resolve from node's require
            try {
                return require(moduleName);
            } catch (e) {
                return null;
            }
        } else if (typeof window !== 'undefined') {
            // attempt to resolve from Window
            return window[moduleName];
        }
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
