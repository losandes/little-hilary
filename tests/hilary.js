/*! little-hilary 2017-04-01 */
(function(register) {
    "use strict";
    register({
        name: "locale",
        factory: {
            errorTypes: {
                INVALID_ARG: "InvalidArgument",
                INVALID_REGISTRATION: "InvalidRegistration",
                MODULE_NOT_FOUND: "ModuleNotFound"
            },
            container: {
                CONSUMER_REQUIRED: "A consumer function is required to `enumerate` over a container"
            },
            hilaryModule: {
                FACTORY_UNDEFINED: "This implementation does not satisfy blueprint, Hilary::HilaryModule. It should have the property, factory.",
                DEPENDENCIES_NO_FACTORY: "Dependencies were declared, but the factory is not a function, so they cannot be applied.",
                DEPENDENCY_FACTORY_MISMATCH: "The number of dependencies that were declared does not match the number of arguments that the factory accepts."
            },
            api: {
                REGISTER_ERR: "register failed. see cause for more information",
                REGISTER_ARG: "register expects either a hilary module, or an array of hilary modules as the first argument, but instead saw this: ",
                RESOLVE_ARG: "resolve expects a moduleName (string) as the first argument, but instead saw this: ",
                MODULE_NOT_FOUND: "The module, {{module}}, cannot be found, and is a dependency of, {{startingModule}}",
                MODULE_NOT_RESOLVABLE: "The module, {{module}}, cannot be resolved because of a dependency exception, causing a ripple effect for, {{startingModule}}",
                REGISTRATION_BLACK_LIST: "A module was registered with a reserved name: ",
                PARENT_CONTAINER_ARG: "setParentScope expects the name of the parent scope, or an instance of Hilary"
            }
        }
    });
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

(function(register) {
    "use strict";
    register({
        name: "Exception",
        factory: Exception
    });
    function Exception(input) {
        return {
            isException: true,
            type: input.type,
            error: input.error,
            messages: input.messages || [],
            data: input.data
        };
    }
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

(function(register) {
    "use strict";
    register({
        name: "Container",
        factory: Container
    });
    function Container(locale, is, Immutable, Exception) {
        return function() {
            var container = {}, self = {
                get: get,
                register: register,
                resolve: resolve,
                exists: exists,
                enumerate: enumerate,
                dispose: dispose,
                disposeOne: disposeOne
            };
            function get() {
                return container;
            }
            function register(hilaryModule) {
                container[hilaryModule.name] = hilaryModule;
            }
            function resolve(name) {
                return container[name];
            }
            function exists(name) {
                return container.hasOwnProperty(name);
            }
            function enumerate(consumer) {
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
            function dispose(moduleName) {
                var key, i, tempResult, result, results = {
                    result: true,
                    failures: []
                };
                if (is.string(moduleName)) {
                    return self.disposeOne(moduleName);
                } else if (is.array(moduleName)) {
                    for (i = 0; i < moduleName.length; i += 1) {
                        tempResult = self.disposeOne(moduleName[i]);
                        results.result = results.result && tempResult;
                        if (!tempResult) {
                            results.failures.push(moduleName[i]);
                        }
                    }
                    return results;
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
            function disposeOne(moduleName) {
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
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

(function(register) {
    "use strict";
    register({
        name: "Context",
        factory: Context
    });
    function Context(Immutable, Container) {
        var IContext = new Immutable({
            __blueprintId: "Hilary::Context",
            scope: "string",
            parent: {
                type: "string",
                required: false
            },
            container: "object",
            singletonContainer: "object"
        });
        return function(options) {
            var context;
            options = options || {};
            context = new IContext({
                scope: options.scope,
                parent: options.parent,
                container: new Container(),
                singletonContainer: new Container()
            });
            if (context.isException) {
                return context;
            }
            context.setParentScope = function(parent) {
                return IContext.merge({
                    parent: parent
                });
            };
            return context;
        };
    }
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

(function(register) {
    "use strict";
    register({
        name: "HilaryModule",
        factory: HilaryModule
    });
    function HilaryModule(is, Blueprint, objectHelper, locale, Exception) {
        var IModule = new Blueprint({
            __blueprintId: "Hilary::HilaryModule",
            isHilaryModule: "boolean",
            name: "string",
            singleton: {
                type: "boolean",
                required: false
            },
            dependencies: {
                type: "array",
                required: false
            },
            factory: {
                validate: function(val, errors, input) {
                    if (is.not.defined(val)) {
                        errors.push(locale.hilaryModule.FACTORY_UNDEFINED);
                    } else if (is.not.function(val) && is.array(input.dependencies) && input.dependencies.length) {
                        errors.push(locale.hilaryModule.DEPENDENCIES_NO_FACTORY);
                    } else if (is.function(val) && is.array(input.dependencies) && input.dependencies.length && val.length !== input.dependencies.length) {
                        errors.push(locale.hilaryModule.DEPENDENCY_FACTORY_MISMATCH);
                    }
                }
            }
        });
        return function(input) {
            input = input || {};
            input.isHilaryModule = true;
            input.singleton = is.boolean(input.singleton) ? input.singleton : true;
            if (is.not.defined(input.dependencies) && is.function(input.factory)) {
                input.dependencies = objectHelper.getArgumentNames(input.factory);
            } else if (input.dependencies === false) {
                input.dependencies = [];
            }
            if (!IModule.validate(input).result) {
                return new Exception({
                    type: locale.errorTypes.INVALID_REGISTRATION,
                    error: new Error(locale.api.REGISTER_ARG + JSON.stringify(input)),
                    messages: IModule.validate(input).errors,
                    data: input
                });
            }
            return input;
        };
    }
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

(function(register) {
    "use strict";
    register({
        name: "Logger",
        factory: Logger
    });
    function Logger(is) {
        return function(options) {
            var self = {
                trace: function() {
                    log(10, arguments);
                },
                debug: function() {
                    log(20, arguments);
                },
                info: function() {
                    log(30, arguments);
                },
                warn: function() {
                    log(40, arguments);
                },
                error: function() {
                    log(50, arguments);
                },
                fatal: function() {
                    log(60, arguments);
                }
            };
            options = new Options(options);
            function log(level, args) {
                var printer;
                if (options.log) {
                    return options.log(level, args);
                }
                if (level < options.level) {
                    return;
                }
                switch (level) {
                  case 60:
                    printer = console.error || console.log;
                    break;

                  case 50:
                    printer = console.error || console.log;
                    break;

                  case 40:
                    printer = console.warn || console.log;
                    break;

                  default:
                    printer = console.log;
                    break;
                }
                printer.apply(null, args);
            }
            return self;
        };
        function Options(options) {
            var level, log;
            if (typeof options === "string") {
                options = {};
            } else {
                options = options || {};
            }
            options.logging = options.logging || {};
            if (options.logging.level && is.string(options.logging.level)) {
                switch (options.logging.level) {
                  case "debug":
                    level = 20;
                    break;

                  case "info":
                    level = 30;
                    break;

                  case "warn":
                    level = 40;
                    break;

                  case "error":
                    level = 50;
                    break;

                  case "fatal":
                    level = 60;
                    break;

                  case "off":
                    level = 70;
                    break;

                  default:
                    level = 10;
                    break;
                }
            } else if (options.logging.level && is.number(options.logging.level) && options.logging.level > 0 && options.logging.level <= 70) {
                level = options.logging.level;
            } else {
                level = 30;
            }
            log = is.function(options.logging.log) ? options.logging.log : null;
            return {
                level: level,
                log: log
            };
        }
    }
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

(function(register) {
    "use strict";
    var ASYNC = "polyn::async", CONTEXT = "hilary::context", ERROR_HANDLER = "hilary::error-handler", IMMUTABLE = "polyn::Immutable", IS = "polyn::is", PARENT = "hilary::parent";
    register({
        name: "HilaryApi",
        factory: HilaryApi
    });
    function HilaryApi(async, is, id, Immutable, locale, Logger, Exception, Context, HilaryModule) {
        var Api, scopes = {}, defaultScope;
        Api = function(options) {
            var self, logger = new Logger(options), config = new Config(options), context, onError, errorHandler;
            context = new Context(config);
            if (context.isException) {
                return context;
            }
            self = {
                register: register,
                resolve: resolve,
                exists: exists,
                dispose: dispose,
                bootstrap: bootstrap,
                scope: scope,
                setParentScope: setParentScope
            };
            setReadOnlyProperty(self, "__isHilaryScope", true);
            setReadOnlyProperty(self, "context", context);
            setReadOnlyProperty(self, "HilaryModule", HilaryModule);
            scopes[config.scope] = self;
            function register(moduleOrArray, callback) {
                var err = new Error(locale.api.REGISTER_ERR);
                if (is.object(moduleOrArray)) {
                    logger.trace("[TRACE] registering a single module:", moduleOrArray);
                    return registerOne(moduleOrArray, err, callback);
                } else if (is.array(moduleOrArray)) {
                    logger.trace("[TRACE] registering an array of modules:", moduleOrArray);
                    return optionalAsync(function() {
                        moduleOrArray.forEach(registerOne);
                        return self;
                    }, err, callback);
                } else {
                    var exc = new Exception({
                        type: locale.errorTypes.INVALID_ARG,
                        error: new Error(locale.api.REGISTER_ARG + JSON.stringify(moduleOrArray)),
                        data: moduleOrArray
                    });
                    logger.trace("[TRACE] registration failed:", exc);
                    onError(exc);
                    return exc;
                }
            }
            function registerOne(input, err, callback) {
                var tasks = [];
                tasks.push(function bind(next) {
                    var hilaryModule = new HilaryModule(input);
                    if (hilaryModule.isException) {
                        logger.trace("[TRACE] Invalid registration model:", hilaryModule);
                        return next(new Exception({
                            type: locale.errorTypes.INVALID_REGISTRATION,
                            error: new Error(hilaryModule.error.message),
                            messages: hilaryModule.messages,
                            data: input
                        }));
                    } else {
                        logger.trace("[TRACE] Successfully bound to HilaryModule:", hilaryModule.name);
                        return next(null, hilaryModule);
                    }
                });
                tasks.push(function optionallyResetErrorHandler(hilaryModule, next) {
                    if (hilaryModule.name === ERROR_HANDLER) {
                        logger.trace("[TRACE] Error handler reset");
                        errorHandler = null;
                    }
                    next(null, hilaryModule);
                });
                tasks.push(function addToContainer(hilaryModule, next) {
                    context.container.register(hilaryModule);
                    logger.trace("[TRACE] Module registered on container", hilaryModule.name);
                    next(null, hilaryModule);
                });
                if (is.function(callback)) {
                    return async.waterfall(tasks, function(err, hilaryModule) {
                        if (err) {
                            logger.trace("[TRACE] Registration failed:", input, err);
                            onError(err);
                            return callback(err);
                        }
                        logger.trace("[TRACE] Registration success:", hilaryModule.name);
                        callback(err, hilaryModule);
                    });
                } else {
                    var output;
                    async.waterfall(tasks, {
                        blocking: true
                    }, function(err, hilaryModule) {
                        if (err) {
                            logger.trace("[TRACE] Registration failed:", input, err);
                            output = err;
                            onError(err);
                            return;
                        }
                        logger.trace("[TRACE] Registration success:", hilaryModule.name);
                        output = hilaryModule;
                    });
                    return output;
                }
            }
            function resolve(moduleName, callback) {
                logger.trace("[TRACE] resolving:", moduleName);
                return resolveOne(moduleName, moduleName, callback);
            }
            function resolveOne(moduleName, relyingModuleName, callback) {
                var ctx = {
                    context: context,
                    config: config,
                    name: moduleName,
                    relyingName: relyingModuleName
                }, tasks = [];
                tasks.push(function(next) {
                    next(null, ctx);
                });
                tasks.push(function validateModuleName(ctx, next) {
                    if (is.string(ctx.name)) {
                        logger.trace("[TRACE] module name is valid:", ctx.name);
                        next(null, ctx);
                    } else {
                        logger.trace("[TRACE] module name is INVALID:", ctx.name);
                        next(new Exception({
                            type: locale.errorTypes.INVALID_ARG,
                            error: new Error(locale.api.RESOLVE_ARG + JSON.stringify(ctx.name))
                        }));
                    }
                });
                tasks.push(function findModule(ctx, next) {
                    if (ctx.context.singletonContainer.exists(ctx.name)) {
                        logger.trace("[TRACE] found singleton for:", ctx.name);
                        ctx.resolved = context.singletonContainer.resolve(ctx.name).factory;
                        ctx.isResolved = true;
                        ctx.registerSingleton = false;
                        next(null, ctx);
                    } else if (context.container.exists(ctx.name)) {
                        logger.trace("[TRACE] found factory for:", ctx.name);
                        ctx.theModule = context.container.resolve(ctx.name);
                        next(null, ctx);
                    } else {
                        logger.trace("[TRACE] module not found:", ctx.name);
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
                tasks.push(function resolveDependencies(ctx, next) {
                    var subTasks;
                    logger.trace("[TRACE] resolving dependencies for:", ctx.name);
                    if (ctx.isResolved) {
                        return next(null, ctx);
                    } else if (is.array(ctx.theModule.dependencies) && ctx.theModule.dependencies.length > 0) {
                        logger.trace("[TRACE] resolving with dependencies array:", ctx.theModule.dependencies.join(", "));
                        subTasks = ctx.theModule.dependencies.map(function(item) {
                            return function(dependencies, relyingModuleName, cb) {
                                var dependency = resolve(item, relyingModuleName);
                                if (!dependency) {
                                    logger.warn("[WARN] the following dependency was not resolved:", item);
                                    return cb(null, dependencies, relyingModuleName);
                                } else if (dependency.isException) {
                                    logger.trace("[TRACE] the following dependency returned an exception:", item);
                                    return cb(dependency);
                                }
                                logger.trace("[TRACE] the following dependency was resolved:", item);
                                dependencies.push(dependency);
                                cb(null, dependencies, relyingModuleName);
                            };
                        });
                        subTasks.unshift(function(cb) {
                            cb(null, [], ctx.relyingName);
                        });
                        return async.waterfall(subTasks, {
                            blocking: true
                        }, function(err, dependencies) {
                            if (err) {
                                logger.trace("[TRACE] at least one dependency was not found for:", ctx.name, err);
                                return next(err);
                            }
                            ctx.resolved = new (Function.prototype.bind.apply(ctx.theModule.factory, [ null ].concat(dependencies)))();
                            ctx.registerSingleton = ctx.theModule.singleton;
                            ctx.isResolved = true;
                            logger.trace("[TRACE] dependencies resolved for:", ctx.name);
                            next(null, ctx);
                        });
                    } else if (is.function(ctx.theModule.factory) && ctx.theModule.factory.length === 0) {
                        logger.trace("[TRACE] the factory is a function and takes no arguments, returning the result of executing it:", ctx.name);
                        ctx.resolved = new (Function.prototype.bind.apply(ctx.theModule.factory, [ null ]))();
                    } else {
                        logger.trace("[TRACE] the factory takes arguments and has no dependencies, returning the function as-is:", ctx.name);
                        ctx.resolved = ctx.theModule.factory;
                    }
                    ctx.registerSingleton = ctx.theModule.singleton;
                    ctx.isResolved = true;
                    next(null, ctx);
                });
                tasks.push(function optionallyRegisterSingleton(ctx, next) {
                    if (ctx.registerSingleton) {
                        logger.trace("[TRACE] registering the resolved module as a singleton: ", ctx.name);
                        context.singletonContainer.register({
                            name: ctx.name,
                            factory: ctx.resolved
                        });
                    }
                    next(null, ctx);
                });
                tasks.push(function bindToOutput(ctx, next) {
                    logger.trace("[TRACE] binding the module to the output:", ctx.name);
                    next(null, ctx.resolved);
                });
                if (is.function(callback)) {
                    async.waterfall(tasks, function(err, results) {
                        if (err && err.type === locale.errorTypes.MODULE_NOT_FOUND && context.parent) {
                            logger.trace("[TRACE] attempting to resolve the module, " + ctx.name + ", on the parent scope:", context.parent);
                            return scopes[context.parent].resolve(moduleName, callback);
                        } else if (err && err.type === locale.errorTypes.MODULE_NOT_FOUND) {
                            logger.trace("[TRACE] attempting to gracefully degrade, " + ctx.name);
                            var result = gracefullyDegrade(ctx.name);
                            if (result) {
                                return callback(null, result);
                            }
                        }
                        if (err) {
                            logger.trace("[TRACE] resolve failed for:", ctx.name, err);
                            onError(err);
                            return callback(err);
                        }
                        logger.trace("[TRACE] module resolved:", ctx.name);
                        callback(null, results);
                    });
                } else {
                    var output;
                    async.waterfall(tasks, {
                        blocking: true
                    }, function(err, results) {
                        if (err && err.type === locale.errorTypes.MODULE_NOT_FOUND && context.parent) {
                            logger.trace("[TRACE] attempting to resolve the module, " + ctx.name + ", on the parent scope:", context.parent);
                            output = scopes[context.parent].resolve(moduleName);
                            return;
                        } else if (err && err.type === locale.errorTypes.MODULE_NOT_FOUND) {
                            logger.trace("[TRACE] attempting to gracefully degrade, " + ctx.name);
                            var result = gracefullyDegrade(ctx.name);
                            if (result) {
                                output = result;
                                return;
                            }
                        }
                        if (err) {
                            logger.trace("[TRACE] resolve failed for:", ctx.name, err);
                            onError(err);
                            output = err;
                            return;
                        }
                        logger.trace("[TRACE] module resolved:", ctx.name);
                        output = results;
                    });
                    return output;
                }
            }
            function exists(moduleName) {
                logger.trace("[TRACE] checking if module exists:", moduleName);
                return context.container.exists(moduleName);
            }
            function dispose(moduleName, callback) {
                logger.trace("[TRACE] disposing module(s):", moduleName);
                return optionalAsync(function() {
                    return context.container.dispose(moduleName) && context.singletonContainer.dispose(moduleName);
                }, callback);
            }
            function scope(name, options, callback) {
                name = name || id.createUid(8);
                options = options || {};
                options.parent = getScopeName(options.parent || self);
                if (scopes[name]) {
                    logger.trace("[TRACE] returning existing scope:", name);
                } else {
                    logger.trace("[TRACE] creating new scope:", name, options);
                }
                return optionalAsync(function() {
                    return Api.scope(name, options);
                }, new Error(), callback);
            }
            function setParentScope(scope) {
                var name = getScopeName(scope);
                if (!name) {
                    logger.trace("[TRACE] unable to set the parent scope of, " + self.context.scope + ", to:", name);
                    return new Exception({
                        type: locale.errorTypes.INVALID_ARG,
                        error: new Error(locale.api.PARENT_CONTAINER_ARG)
                    });
                }
                logger.trace("[TRACE] setting the parent scope of, " + self.context.scope + ", to:", name);
                context = context.setParentScope(name);
                return context;
            }
            function getScopeName(scope) {
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
            function bootstrap(startup, callback) {
                var tasks = [], done;
                startup = startup || {};
                if (is.function(startup.onComposed)) {
                    logger.trace("[TRACE] using onComposed as the callback for the bootstrapper (ignores the callback argument) for:", self.context.scope);
                    done = startup.onComposed;
                } else if (is.function(callback)) {
                    logger.trace("[TRACE] using the callback argument for the bootstrapper for:", self.context.scope);
                    done = callback;
                } else {
                    logger.trace("[TRACE] a callback was not defined for the bootstrapper for:", self.context.scope);
                    done = function(err) {
                        if (err) {
                            logger.fatal(err);
                        }
                    };
                }
                tasks.push(function start(next) {
                    next(null, self);
                });
                if (is.function(startup.composeModules)) {
                    logger.trace("[TRACE] composing modules for:", self.context.scope);
                    tasks.push(startup.composeModules);
                }
                async.waterfall(tasks, done);
            }
            function resolveErrorHandler() {
                return {
                    throw: function(exception) {
                        logger.error(exception);
                    }
                };
                var tempHandler;
                if (errorHandler) {
                    return errorHandler;
                }
                try {
                    tempHandler = self.resolve(ERROR_HANDLER);
                    if (tempHandler && is.function(tempHandler.throw)) {
                        logger.trace("[TRACE] using custom error handler for:", self.context.scope);
                        errorHandler = tempHandler;
                    } else {
                        logger.trace("[TRACE] using default error handler for:", self.context.scope);
                        errorHandler = {
                            throw: function(exception) {
                                logger.error(exception);
                            }
                        };
                    }
                } catch (e) {
                    logger.warn(e);
                }
            }
            onError = function(err) {
                async.runAsync(function() {
                    var exception;
                    if (err.isException) {
                        exception = err;
                    } else {
                        exception = new Exception({
                            type: "UNKNOWN",
                            error: err
                        });
                    }
                    resolveErrorHandler().throw(exception);
                }, true);
            };
            function optionalAsync(func, err, callback) {
                if (is.function(callback)) {
                    async.runAsync(function() {
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
                    err.message += "(" + e.message + ")";
                    err.cause = e;
                    onError(err);
                    return {
                        err: err,
                        isException: true
                    };
                }
            }
            function Config(options) {
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
                self.logging = options.logging || {
                    level: 30
                };
                if (is.string(options.parent)) {
                    self.parent = options.parent;
                } else if (options.parent && options.parent.__isHilaryScope) {
                    self.parent = options.parent.context.scope;
                }
                return self;
            }
            return self;
        };
        Api.scope = function(name, options) {
            if (scopes[name]) {
                return scopes[name];
            } else {
                options = options || {};
                options.name = name;
                scopes[name] = new Api(options);
                return scopes[name];
            }
        };
        defaultScope = Api.scope("default");
        defaultScope.Context = Context;
        defaultScope.context.singletonContainer.register({
            name: ASYNC,
            factory: async
        });
        defaultScope.context.singletonContainer.register({
            name: CONTEXT,
            singleton: false,
            factory: function() {
                return defaultScope.context;
            }
        });
        defaultScope.context.singletonContainer.register({
            name: IMMUTABLE,
            factory: Immutable
        });
        defaultScope.context.singletonContainer.register({
            name: IS,
            factory: is
        });
        defaultScope.context.singletonContainer.register({
            name: PARENT,
            factory: function() {
                return defaultScope.context.parent;
            }
        });
        return defaultScope;
    }
    function setReadOnlyProperty(obj, name, value) {
        Object.defineProperty(obj, name, {
            enumerable: false,
            configurable: false,
            get: function() {
                return value;
            },
            set: function() {
                console.log(name + " is read only");
            }
        });
    }
    function gracefullyDegrade(moduleName) {
        if (typeof module !== "undefined" && module.exports && require) {
            try {
                return require(moduleName);
            } catch (e) {
                return null;
            }
        } else if (typeof window !== "undefined") {
            return window[moduleName];
        }
    }
})(function(registration) {
    "use strict";
    try {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== "undefined") {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error("[HILARY] Unkown runtime environment");
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : "MISSING NAME";
        var err = new Error("[HILARY] Registration failure: " + name);
        err.cause = e;
        throw err;
    }
});

if (typeof module !== "undefined" && module.exports) {
    var polyn = require("polyn"), locale = require("./locale"), Exception = require("./Exception"), Container = require("./Container")(locale, polyn.is, polyn.Immutable, Exception), Context = require("./Context")(polyn.Immutable, Container), HilaryModule = require("./HilaryModule")(polyn.is, polyn.Blueprint, polyn.objectHelper, locale, Exception), Logger = require("./Logger")(polyn.is), hilary = require("./HilaryApi")(polyn.async, polyn.is, polyn.id, polyn.Immutable, locale, Logger, Exception, Context, HilaryModule);
    polyn.Blueprint.configure({
        compatibility: "2017-03-20"
    });
    module.exports = hilary;
} else if (typeof window !== "undefined") {
    if (!window.polyn) {
        throw new Error("[HILARY] Hilary depends on polyn. Make sure it is included before loading Hilary (https://github.com/losandes/polyn)");
    } else if (!window.__hilary) {
        throw new Error("[HILARY] Hilary modules were loaded out of order");
    }
    (function(polyn, __hilary, window) {
        "use strict";
        var locale = __hilary.locale, Exception = __hilary.Exception, Container = __hilary.Container(locale, polyn.is, polyn.Immutable, Exception), Context = __hilary.Context(polyn.Immutable, Container), HilaryModule = __hilary.HilaryModule(polyn.is, polyn.Blueprint, polyn.objectHelper, locale, Exception), Logger = __hilary.Logger(polyn.is);
        polyn.Blueprint.configure({
            compatibility: "2017-03-20"
        });
        window.hilary = __hilary.HilaryApi(polyn.async, polyn.is, polyn.id, polyn.Immutable, locale, Logger, Exception, Context, HilaryModule);
    })(window.polyn, window.__hilary, window);
} else {
    throw new Error("[HILARY] Unkown runtime environment");
}