/*! polyn 2017-03-15 */
(function() {
    "use strict";
    var polyn = {}, warn;
    warn = function(err) {
        var log = console.warn || console.log;
        log(err.message, err);
        return err;
    };
    if (!window) {
        return warn(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME"));
    }
    Object.defineProperty(window, "polyn", {
        get: function() {
            return polyn;
        },
        set: function() {
            return warn(new Error("[POLYN] polyn modules are read-only"));
        },
        enumerable: true,
        configurable: false
    });
    Object.defineProperty(polyn, "addModule", {
        get: function() {
            return addModule;
        },
        set: function() {
            return warn(new Error("[POLYN] polyn modules are read-only"));
        },
        enumerable: true,
        configurable: false
    });
    function addModule(name, dependencies, Factory) {
        var i, singleton;
        if (Array.isArray(dependencies)) {
            for (i = 0; i < dependencies.length; i += 1) {
                if (!polyn[dependencies[i]]) {
                    return warn(new Error("[POLYN] Unable to define module: LOADED OUT OF ORDER"));
                }
            }
        }
        singleton = new Factory(polyn);
        Object.defineProperty(polyn, name, {
            get: function() {
                return singleton;
            },
            set: function() {
                return warn(new Error("[POLYN] polyn modules are read-only"));
            },
            enumerable: true,
            configurable: false
        });
    }
})();

(function() {
    "use strict";
    var errorTypeWarning = "[POLYN] EXCEPTION WARNING: You should always pass an Error to Exception, to preserve your stack trace", config = {
        onWarning: function(message) {
            console.log(message);
        }
    };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = Exception;
    } else if (window && window.polyn) {
        window.polyn.addModule("Exception", null, function() {
            return Exception;
        });
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function normalizeType(type) {
        return typeof type === "string" ? type : "Exception";
    }
    function normalizeError(type, error) {
        if (typeof type === "object") {
            return type;
        }
        var err = error;
        if (typeof error === "string") {
            config.onWarning(errorTypeWarning);
            err = new Error(error);
        } else if (!error) {
            config.onWarning(errorTypeWarning);
            err = new Error("UNKNOWN");
        }
        return err;
    }
    function normalizeMessages(error, messages) {
        var msgs = [];
        if (Array.isArray(messages)) {
            msgs = messages;
        } else if (messages) {
            msgs.push(messages);
        } else if (!messages && error && error.message) {
            msgs.push(error.message);
        }
        return msgs;
    }
    function Exception(type, error, messages) {
        var err = normalizeError(type, error);
        return {
            type: normalizeType(type),
            error: err,
            messages: normalizeMessages(err, messages),
            isException: true
        };
    }
    Exception.configure = function(cfg) {
        cfg = cfg || {};
        if (typeof cfg.onWarning === "function") {
            config.onWarning = cfg.onWarning;
        }
    };
})();

(function() {
    "use strict";
    var async = Async();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = async;
    } else if (window && window.polyn) {
        window.polyn.addModule("async", null, Async);
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function Async() {
        var async = {
            runAsync: runAsync,
            waterfall: waterfall
        };
        function runAsync(func, highPriority) {
            if (highPriority === true && typeof process !== "undefined" && typeof process.nextTick === "function") {
                process.nextTick(func);
            } else {
                setTimeout(func, 0);
            }
        }
        function waterfall(tasks, options, callback) {
            var idx = -1;
            if (typeof options === "function") {
                callback = once(options || noop);
                options = {
                    blocking: false
                };
            } else {
                callback = once(callback || noop);
                options = options || {};
            }
            if (!Array.isArray(tasks)) {
                return callback(new Error("The first argument to waterfall must be an array of functions"));
            }
            if (!tasks.length) {
                return callback();
            }
            nextTask();
            function nextTask() {
                runAsyncTask(idx += 1, arguments);
            }
            function runAsyncTask(idx, originalArgs) {
                optionalAsync(function() {
                    try {
                        var err = originalArgs[0], args = makeArgArray(originalArgs);
                        if (err) {
                            return callback.apply(null, [ err ].concat(args));
                        } else if (idx === tasks.length) {
                            return callback.apply(null, [ null ].concat(args));
                        }
                        args.push(onlyOnce(nextTask));
                        tasks[idx].apply(null, args);
                    } catch (e) {
                        return callback.apply(null, [ e ]);
                    }
                }, true);
            }
            function optionalAsync(func) {
                if (options.blocking) {
                    func();
                } else {
                    runAsync(func, true);
                }
            }
        }
        return async;
    }
    function once(func) {
        return function() {
            if (func === null) {
                return;
            }
            var callFn = func;
            func = null;
            callFn.apply(this, arguments);
        };
    }
    function onlyOnce(func) {
        return function() {
            if (func === null) {
                throw new Error("Callback was already called.");
            }
            var callFn = func;
            func = null;
            callFn.apply(this, arguments);
        };
    }
    function noop() {}
    function makeArgArray(args) {
        var prop, arr = [];
        for (prop in args) {
            if (args.hasOwnProperty(prop)) {
                arr.push(args[prop]);
            }
        }
        arr.shift();
        return arr;
    }
})();

(function() {
    "use strict";
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, ARGUMENT_NAMES = /([^\s,]+)/g, FUNCTION_TEMPLATE = "newFunc = function ({{args}}) { return that.apply(that, arguments); }", locale = {
        errorTypes: {
            invalidArgumentException: "InvalidArgumentException"
        },
        errors: {
            cannotCopyFunction: "Valid values for the function argument are a function, null, or undefined"
        }
    };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = new Factory({
            async: require("./async.js")
        });
    } else if (window && window.polyn) {
        window.polyn.addModule("objectHelper", [ "async" ], Factory);
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function Factory(polyn) {
        return new ObjectHelper(polyn.async);
    }
    function ObjectHelper(async) {
        var self = {};
        function setReadOnlyProperty(obj, name, val, onError) {
            var defaultErrorMessage = "the {{name}} property is read-only".replace(/{{name}}/, name);
            Object.defineProperty(obj, name, {
                get: function() {
                    return val;
                },
                set: function() {
                    if (typeof onError === "function") {
                        return onError(defaultErrorMessage);
                    }
                    var err = new Error(defaultErrorMessage);
                    console.log(err);
                    return err;
                },
                enumerable: true,
                configurable: false
            });
        }
        function copyValue(val) {
            if (!val) {
                return val;
            }
            try {
                if (isDate(val)) {
                    return new Date(val);
                } else if (isFunction(val)) {
                    return copyFunction(val);
                } else if (isRegex(val)) {
                    return new RegExp(val);
                } else if (isObject(val) && !Array.isArray(val)) {
                    return syncCloneObject(val, true);
                } else {
                    return JSON.parse(JSON.stringify(val));
                }
            } catch (e) {
                return {
                    type: locale.errorTypes.invalidArgumentException,
                    error: e,
                    messages: [ e.message ],
                    isException: true
                };
            }
        }
        function copyFunction(func) {
            var newFunc, that, prop;
            if (func && typeof func !== "function") {
                return {
                    type: locale.errorTypes.invalidArgumentException,
                    error: new Error(locale.errors.cannotCopyFunction),
                    messages: [ locale.errors.cannotCopyFunction ],
                    isException: true
                };
            } else if (!func) {
                return func;
            }
            that = func.__clonedFrom || func;
            eval(FUNCTION_TEMPLATE.replace(/{{args}}/, getArgumentNames(func).join(", ")));
            for (prop in that) {
                if (that.hasOwnProperty(prop)) {
                    newFunc[prop] = copyValue(that[prop]);
                }
            }
            newFunc.__clonedFrom = that;
            return newFunc;
        }
        function getArgumentNames(func, callback) {
            if (typeof callback === "function") {
                async.runAsync(function() {
                    var args = syncGetArgumentNames(func);
                    if (args.isException) {
                        callback(args);
                    } else {
                        callback(null, args);
                    }
                });
            } else {
                return syncGetArgumentNames(func);
            }
        }
        function syncGetArgumentNames(func) {
            var functionTxt, result;
            if (func && typeof func !== "function") {
                return {
                    type: locale.errorTypes.invalidArgumentException,
                    error: new Error(locale.errors.cannotCopyFunction),
                    messages: [ locale.errors.cannotCopyFunction ],
                    isException: true
                };
            } else if (!func) {
                return [];
            }
            functionTxt = func.toString().replace(STRIP_COMMENTS, "");
            result = functionTxt.slice(functionTxt.indexOf("(") + 1, functionTxt.indexOf(")")).match(ARGUMENT_NAMES);
            if (result === null) {
                result = [];
            }
            return result;
        }
        function cloneObject(from, deep, callback) {
            if (typeof callback === "function") {
                async.runAsync(function() {
                    var cloned = syncCloneObject(from, deep);
                    if (cloned.isException) {
                        callback(cloned);
                    } else {
                        callback(null, cloned);
                    }
                });
            } else {
                return syncCloneObject(from, deep);
            }
        }
        function syncCloneObject(from, deep) {
            var newVals = {}, propName;
            if (typeof deep === "undefined") {
                deep = true;
            }
            for (propName in from) {
                if (!from.hasOwnProperty(propName)) {
                    continue;
                }
                if (deep && isObject(from[propName]) && !isDate(from[propName])) {
                    newVals[propName] = syncCloneObject(from[propName]);
                } else if (!deep && isObject(from[propName]) && !isDate(from[propName])) {
                    newVals[propName] = null;
                } else {
                    newVals[propName] = copyValue(from[propName], newVals);
                }
                if (newVals[propName] && newVals[propName].isException) {
                    return newVals[propName];
                }
            }
            return newVals;
        }
        function merge(from, mergeVals, callback) {
            if (typeof callback === "function") {
                async.runAsync(function() {
                    var merged = syncMerge(from, mergeVals);
                    if (merged.isException) {
                        callback(merged);
                    } else {
                        callback(null, merged);
                    }
                });
            } else {
                return syncMerge(from, mergeVals);
            }
        }
        function syncMerge(from, mergeVals) {
            var newVals = syncCloneObject(from), propName;
            for (propName in mergeVals) {
                if (!mergeVals.hasOwnProperty(propName)) {
                    continue;
                }
                if (isObject(mergeVals[propName]) && !isDate(mergeVals[propName])) {
                    newVals[propName] = merge(from[propName], mergeVals[propName]);
                } else {
                    newVals[propName] = mergeVals[propName];
                }
            }
            return newVals;
        }
        function isDate(val) {
            return typeof val === "object" && Object.prototype.toString.call(val) === "[object Date]";
        }
        function isFunction(val) {
            return typeof val === "function";
        }
        function isObject(val) {
            return typeof val === "object";
        }
        function isRegex(val) {
            return val && val instanceof RegExp;
        }
        setReadOnlyProperty(self, "setReadOnlyProperty", setReadOnlyProperty);
        setReadOnlyProperty(self, "copyValue", copyValue);
        setReadOnlyProperty(self, "cloneObject", cloneObject);
        setReadOnlyProperty(self, "merge", merge);
        setReadOnlyProperty(self, "getArgumentNames", getArgumentNames);
        return self;
    }
})();

(function() {
    "use strict";
    if (typeof module !== "undefined" && module.exports) {
        module.exports = new Id();
    } else if (window && window.polyn) {
        window.polyn.addModule("id", null, Id);
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function Id() {
        var id = {
            createUid: undefined,
            createGuid: undefined
        }, createRandomString;
        createRandomString = function(templateString) {
            return templateString.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c === "x" ? r : r & 3 | 8;
                return v.toString(16);
            });
        };
        id.createUid = function(length) {
            var template;
            length = length || 12;
            template = new Array(length + 1).join("x");
            return createRandomString(template);
        };
        id.createGuid = function() {
            return createRandomString("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx");
        };
        return id;
    }
})();

(function() {
    "use strict";
    if (typeof module !== "undefined" && module.exports) {
        module.exports = new Is();
    } else if (window && window.polyn) {
        window.polyn.addModule("is", null, Is);
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function Is() {
        var is = {
            getType: undefined,
            defined: undefined,
            nullOrUndefined: undefined,
            function: undefined,
            object: undefined,
            array: undefined,
            string: undefined,
            bool: undefined,
            boolean: undefined,
            date: undefined,
            datetime: undefined,
            regexp: undefined,
            number: undefined,
            nullOrWhitespace: undefined,
            money: undefined,
            decimal: undefined,
            Window: undefined,
            ObjectID: undefined,
            not: {
                defined: undefined,
                function: undefined,
                object: undefined,
                array: undefined,
                string: undefined,
                bool: undefined,
                boolean: undefined,
                date: undefined,
                datetime: undefined,
                regexp: undefined,
                number: undefined,
                nullOrWhitespace: undefined,
                money: undefined,
                decimal: undefined,
                Window: undefined,
                ObjectID: undefined
            }
        }, class2Types = {}, class2ObjTypes = [ "Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object" ], i, name;
        for (i = 0; i < class2ObjTypes.length; i += 1) {
            name = class2ObjTypes[i];
            class2Types["[object " + name + "]"] = name.toLowerCase();
        }
        is.getType = function(obj) {
            if (typeof obj === "undefined") {
                return "undefined";
            }
            if (obj === null) {
                return String(obj);
            }
            return typeof obj === "object" || typeof obj === "function" ? class2Types[Object.prototype.toString.call(obj)] || "object" : typeof obj;
        };
        is.defined = function(obj) {
            try {
                return is.getType(obj) !== "undefined";
            } catch (e) {
                return false;
            }
        };
        is.not.defined = function(obj) {
            return is.defined(obj) === false;
        };
        is.nullOrUndefined = function(obj) {
            return is.not.defined(obj) || obj === null;
        };
        is.not.nullOrWhitespace = function(str) {
            if (typeof str === "undefined" || typeof str === null || is.not.string(str)) {
                return false;
            }
            return /([^\s])/.test(str);
        };
        is.nullOrWhitespace = function(str) {
            return is.not.nullOrWhitespace(str) === false;
        };
        is.function = function(obj) {
            return is.getType(obj) === "function";
        };
        is.not.function = function(obj) {
            return is.function(obj) === false;
        };
        is.object = function(obj) {
            return is.getType(obj) === "object";
        };
        is.not.object = function(obj) {
            return is.object(obj) === false;
        };
        is.array = function(obj) {
            return is.getType(obj) === "array";
        };
        is.not.array = function(obj) {
            return is.array(obj) === false;
        };
        is.string = function(obj) {
            return is.getType(obj) === "string";
        };
        is.not.string = function(obj) {
            return is.string(obj) === false;
        };
        is.bool = function(obj) {
            return is.getType(obj) === "boolean";
        };
        is.not.bool = function(obj) {
            return is.boolean(obj) === false;
        };
        is.boolean = function(obj) {
            return is.getType(obj) === "boolean";
        };
        is.not.boolean = function(obj) {
            return is.boolean(obj) === false;
        };
        is.datetime = function(obj) {
            return is.getType(obj) === "date" && is.function(obj.getTime) && !isNaN(obj.getTime());
        };
        is.not.datetime = function(obj) {
            return is.datetime(obj) === false;
        };
        is.date = is.datetime;
        is.not.date = is.not.datetime;
        is.regexp = function(obj) {
            return is.getType(obj) === "regexp";
        };
        is.not.regexp = function(obj) {
            return is.regexp(obj) === false;
        };
        is.number = function(obj) {
            return is.getType(obj) === "number";
        };
        is.not.number = function(obj) {
            return is.number(obj) === false;
        };
        is.money = function(val) {
            return is.defined(val) && /^(?:-)?[0-9]\d*(?:\.\d{0,2})?$/.test(val.toString());
        };
        is.not.money = function(val) {
            return is.money(val) === false;
        };
        is.decimal = function(num, places) {
            if (is.not.number(num)) {
                return false;
            }
            if (!places && is.number(num)) {
                return true;
            }
            if (!num || +(+num || 0).toFixed(places) !== +num) {
                return false;
            }
            return true;
        };
        is.not.decimal = function(val) {
            return is.decimal(val) === false;
        };
        is.Window = function(obj) {
            return is.defined(Window) && obj instanceof Window;
        };
        is.not.Window = function(obj) {
            return is.Window(obj) === false;
        };
        is.ObjectID = function(obj) {
            return is.defined(obj) && obj._bsontype === "ObjectID";
        };
        is.not.ObjectID = function(obj) {
            return is.ObjectID(obj) === false;
        };
        return is;
    }
})();

(function() {
    "use strict";
    if (typeof module !== "undefined" && module.exports) {
        module.exports = Factory({
            async: require("./async.js"),
            id: require("./id.js"),
            is: require("./is.js"),
            Exception: require("./Exception.js"),
            objectHelper: require("./objectHelper.js")
        });
    } else if (window && window.polyn) {
        window.polyn.addModule("Blueprint", [ "async", "id", "is", "Exception", "objectHelper" ], Factory);
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function Factory(polyn) {
        return new Blueprint(polyn.async, polyn.id, polyn.is, polyn.Exception, polyn.objectHelper);
    }
    function Blueprint(async, id, is, Exception, objectHelper) {
        var Blueprint, signatureMatches, syncSignatureMatches, validateSignature, syncValidateSignature, validateProperty, validatePropertyWithDetails, validatePropertyType, validateFunctionArguments, validateDecimalWithPlaces, validateBooleanArgument, validateNestedBlueprint, validateRegExp, addValidationMemoryProperty, rememberValidation, isAlreadyValidated, dateIsBefore, dateIsAfter, makeErrorMessage, setReadOnlyProp, setDefaultCompatibility, setDefaultConfiguration, config = {}, versions = {
            v20161119: new Date("2016-11-19"),
            v20161120: new Date("2016-11-20")
        }, locale = {
            errorTypes: {
                invalidArgumentException: "InvalidArgumentException",
                readOnlyViolation: "ReadOnlyViolation"
            },
            errors: {
                requiresImplementation: "An implementation is required to create a new instance of an interface",
                requiresProperty: "This implementation does not satisfy blueprint, {{blueprint}}. It should have the property, {{property}}, with type, {{type}}.",
                requiresArguments: "This implementation does not satisfy blueprint, {{blueprint}}. The function, {{property}}, is missing arguments",
                missingConstructorArgument: "An object literal is required when constructing a Blueprint",
                missingSignaturesMatchBlueprintArgument: "The `blueprint` argument is required",
                missingSignaturesMatchImplementationArgument: "The `implementation` argument is required",
                missingSignaturesMatchCallbackArgument: "The `callback` argument is required",
                configurationCompatibilityIsNotValid: "The date you tried to set the Blueprint compatibility to is not valid",
                validatePropertyInvalidArgs: "To validate a single property, you must provide the blueprint, and the property name",
                validatePropertyNoBlueprintValue: "The {{property}} property does not exist on the blueprint",
                validatePropertyFailed: "An error occurred while validating the property"
            }
        };
        signatureMatches = function(implementation, blueprint, callback) {
            var newCallback;
            implementation = addValidationMemoryProperty(implementation);
            newCallback = function(err, result) {
                if (!err) {
                    rememberValidation(implementation, blueprint);
                }
                if (typeof callback === "function") {
                    callback(err, result);
                }
            };
            validateSignature(implementation, blueprint, newCallback);
        };
        syncSignatureMatches = function(implementation, blueprint) {
            var validationResult;
            implementation = addValidationMemoryProperty(implementation);
            validationResult = syncValidateSignature(implementation, blueprint);
            if (validationResult.result) {
                rememberValidation(implementation, blueprint);
            }
            return validationResult;
        };
        validateSignature = function(implementation, blueprint, callback) {
            async.runAsync(function() {
                var validationResult = syncValidateSignature(implementation, blueprint);
                if (validationResult.result) {
                    callback(null, true);
                } else {
                    callback(validationResult.errors, false);
                }
            });
        };
        syncValidateSignature = function(implementation, blueprint) {
            var errors = [], prop;
            if (isAlreadyValidated(implementation, blueprint)) {
                return {
                    errors: null,
                    result: true
                };
            }
            for (prop in blueprint.props) {
                if (blueprint.props.hasOwnProperty(prop)) {
                    validateProperty(blueprint.__blueprintId, implementation, prop, blueprint.props[prop], errors);
                }
            }
            if (errors.length > 0) {
                return {
                    errors: errors,
                    result: false
                };
            } else {
                return {
                    errors: null,
                    result: true
                };
            }
        };
        validateProperty = function(blueprintId, implementation, propertyName, propertyValue, errors) {
            if (is.string(propertyValue)) {
                validatePropertyType(blueprintId, implementation, propertyName, propertyValue, errors);
            } else if (is.regexp(propertyValue)) {
                validateRegExp(blueprintId, implementation, propertyName, propertyValue, errors);
            } else if (is.object(propertyValue)) {
                validatePropertyWithDetails(blueprintId, implementation, propertyName, propertyValue, propertyValue.type, errors);
            }
        };
        validatePropertyWithDetails = function(blueprintId, implementation, propertyName, propertyValue, type, errors) {
            if (propertyValue.required === false && (is.not.defined(implementation[propertyName]) || implementation[propertyName] === null)) {
                return;
            } else if (is.function(propertyValue.validate)) {
                propertyValue.validate(implementation[propertyName], errors, implementation);
            } else {
                switch (type) {
                  case "blueprint":
                    validateNestedBlueprint(propertyValue.blueprint, implementation, propertyName, errors);
                    break;

                  case "function":
                    validatePropertyType(blueprintId, implementation, propertyName, type, errors);
                    if (propertyValue.args) {
                        validateFunctionArguments(blueprintId, implementation, propertyName, propertyValue.args, errors);
                    }
                    break;

                  case "decimal":
                    validateDecimalWithPlaces(blueprintId, implementation, propertyName, propertyValue.places, errors);
                    break;

                  case "expression":
                    validateRegExp(blueprintId, implementation, propertyName, propertyValue.expression, errors);
                    break;

                  default:
                    validatePropertyType(blueprintId, implementation, propertyName, type, errors);
                    break;
                }
            }
        };
        validatePropertyType = function(blueprintId, implementation, propertyName, propertyType, errors) {
            if (is.function(is.not[propertyType]) && is.not[propertyType](implementation[propertyName])) {
                errors.push(makeErrorMessage(locale.errors.requiresProperty, blueprintId, propertyName, propertyType));
            }
        };
        validateFunctionArguments = function(blueprintId, implementation, propertyName, propertyArguments, errors) {
            var argumentsAreValid, argumentsString;
            argumentsAreValid = is.array(propertyArguments);
            argumentsAreValid = argumentsAreValid && propertyArguments.length > 0;
            argumentsAreValid = argumentsAreValid && is.function(implementation[propertyName]);
            argumentsAreValid = argumentsAreValid && implementation[propertyName].length === propertyArguments.length;
            if (!argumentsAreValid) {
                try {
                    argumentsString = propertyArguments.join(", ");
                } catch (e) {
                    argumentsString = propertyArguments.toString();
                }
                errors.push(makeErrorMessage(locale.errors.requiresArguments, blueprintId, propertyName, argumentsString));
            }
        };
        validateDecimalWithPlaces = function(blueprintId, implementation, propertyName, places, errors) {
            if (is.not.decimal(implementation[propertyName], places)) {
                errors.push(makeErrorMessage(locale.errors.requiresProperty, blueprintId, propertyName, "decimal with " + places + " places"));
            }
        };
        validateBooleanArgument = function(blueprintId, implementation, propertyName, errors) {
            if (is.function(is.not.boolean) && is.not.boolean(implementation[propertyName])) {
                errors.push(makeErrorMessage(locale.errors.requiresProperty, blueprintId, propertyName, "boolean"));
            }
        };
        validateNestedBlueprint = function(blueprint, implementation, propertyName, errors) {
            var validationResult = blueprint.syncSignatureMatches(implementation[propertyName]), i;
            if (!validationResult.result) {
                for (i = 0; i < validationResult.errors.length; i += 1) {
                    errors.push(validationResult.errors[i]);
                }
            }
        };
        validateRegExp = function(blueprintId, implementation, propertyName, regex, errors) {
            if (regex.test(implementation[propertyName]) === false) {
                errors.push(makeErrorMessage(locale.errors.requiresProperty, blueprintId, propertyName, regex.toString()));
            }
        };
        addValidationMemoryProperty = function(implementation) {
            if (config.rememberValidation) {
                implementation[config.memoryPropertName] = implementation[config.memoryPropertName] || {};
            }
            return implementation;
        };
        rememberValidation = function(implementation, blueprint) {
            if (config.rememberValidation) {
                implementation[config.memoryPropertName][blueprint.__blueprintId] = true;
            }
            return implementation;
        };
        isAlreadyValidated = function(implementation, blueprint) {
            return implementation[config.memoryPropertName] && implementation[config.memoryPropertName][blueprint.__blueprintId];
        };
        dateIsBefore = function(baselineDate, comparisonDate) {
            return comparisonDate < baselineDate;
        };
        dateIsAfter = function(baselineDate, comparisonDate) {
            return comparisonDate > baselineDate;
        };
        makeErrorMessage = function(message, blueprintId, propertyName, propertyType) {
            return message.replace(/{{blueprint}}/gi, blueprintId).replace(/{{property}}/gi, propertyName).replace(/{{type}}/gi, propertyType);
        };
        setReadOnlyProp = function(obj, name, val) {
            objectHelper.setReadOnlyProperty(obj, name, val, function() {
                var err = new Exception(locale.errorTypes.readOnlyViolation, new Error(name + " is read-only"));
                config.onError(err);
                return err;
            });
        };
        Blueprint = function(blueprint) {
            var self = {}, props = {}, hasInvalidProperties = false, prop;
            blueprint = blueprint || {};
            for (prop in blueprint) {
                if (!blueprint.hasOwnProperty(prop)) {
                    continue;
                }
                if (prop === "__blueprintId") {
                    setReadOnlyProp(self, "__blueprintId", blueprint.__blueprintId);
                } else if (Blueprint.isValidatableProperty(blueprint[prop])) {
                    setReadOnlyProp(props, prop, blueprint[prop]);
                } else {
                    hasInvalidProperties = true;
                    var err = new Exception(locale.errorTypes.invalidArgumentException, new Error(prop + " is not validatable by Blueprint"));
                    config.onError(err);
                }
            }
            if (is.not.string(self.__blueprintId)) {
                setReadOnlyProp(self, "__blueprintId", id.createUid(8));
            }
            setReadOnlyProp(self, "props", props);
            setReadOnlyProp(self, "validate", function(implementation, callback) {
                return Blueprint.validate(self, implementation, callback);
            });
            setReadOnlyProp(self, "validateProperty", function(propertyName, propertyValue, callback) {
                return Blueprint.validateProperty(self, propertyName, propertyValue, callback);
            });
            setReadOnlyProp(self, "signatureMatches", function(implementation, callback) {
                return Blueprint.validate(self, implementation, callback);
            });
            setReadOnlyProp(self, "syncSignatureMatches", function(implementation) {
                return Blueprint.syncValidate(self, implementation);
            });
            setReadOnlyProp(self, "inherits", function(otherBlueprint) {
                return Blueprint.syncMerge([ self, otherBlueprint ]);
            });
            setReadOnlyProp(self, "hasInvalidProperties", hasInvalidProperties);
            setReadOnlyProp(self, "getSchema", function() {
                return objectHelper.cloneObject(blueprint);
            });
            return self;
        };
        Blueprint.validate = function(blueprint, implementation, callback) {
            if (is.not.function(callback)) {
                return Blueprint.syncValidate(blueprint, implementation);
            }
            async.runAsync(function() {
                signatureMatches(implementation, blueprint, callback);
            });
        };
        Blueprint.syncValidate = function(blueprint, implementation) {
            if (is.not.defined(blueprint)) {
                return {
                    errors: [ locale.errors.missingSignaturesMatchBlueprintArgument ],
                    result: false
                };
            }
            if (is.not.defined(implementation)) {
                return {
                    errors: [ locale.errors.missingSignaturesMatchImplementationArgument ],
                    result: false
                };
            }
            return syncSignatureMatches(implementation, blueprint);
        };
        Blueprint.validateProperty = function(blueprint, propertyName, propertyValue, callback) {
            if (is.not.function(callback)) {
                return Blueprint.syncValidateProperty(blueprint, propertyName, propertyValue);
            }
            async.runAsync(function() {
                var outcome = Blueprint.syncValidateProperty(blueprint, propertyName, propertyValue);
                if (!outcome) {
                    return callback([ locale.errors.validatePropertyFailed ], false);
                }
                callback(outcome.errors, outcome.result);
            });
        };
        Blueprint.syncValidateProperty = function(blueprint, propertyName, propertyValue) {
            var implementation = {}, errors = [], blueprintProp;
            if (is.not.defined(blueprint) || is.not.string(propertyName)) {
                return {
                    errors: [ locale.errors.validatePropertyInvalidArgs ],
                    result: false
                };
            }
            blueprintProp = blueprint.props && blueprint.props[propertyName] || blueprint[propertyName];
            if (is.not.defined(blueprintProp)) {
                return {
                    errors: [ locale.errors.validatePropertyNoBlueprintValue.replace(/{{property}}/, propertyName) ],
                    result: false
                };
            }
            implementation[propertyName] = propertyValue;
            validateProperty(blueprint.__blueprintId, implementation, propertyName, blueprintProp, errors);
            return {
                errors: errors.length === 0 ? null : errors,
                result: errors.length === 0 ? true : false
            };
        };
        Blueprint.merge = function(blueprints, callback) {
            if (typeof callback !== "function") {
                return Blueprint.syncMerge(blueprints);
            }
            async.runAsync(function() {
                callback(null, Blueprint.syncMerge(blueprints));
            });
        };
        Blueprint.syncMerge = function(blueprints) {
            var blueprint1, prop, next = true;
            if (!Array.isArray(blueprints)) {
                return null;
            }
            blueprint1 = blueprints.shift();
            while (next) {
                next = blueprints.shift();
                if (!next) {
                    break;
                }
                for (prop in next.props) {
                    if (next.props.hasOwnProperty(prop)) {
                        blueprint1.props[prop] = blueprint1.props[prop] || next.props[prop];
                    }
                }
            }
            return blueprint1;
        };
        setDefaultCompatibility = function(cfg) {
            if (is.string(cfg.compatibility)) {
                try {
                    config.compatibility = new Date(cfg.compatibility);
                } catch (e) {
                    config.compatibility = new Date("2016-11-19");
                    console.log(locale.errors.configurationCompatibilityIsNotValid);
                }
            } else if (is.date(cfg.compatibility)) {
                config.compatibility = cfg.compatibility;
            } else {
                config.compatibility = new Date("2016-11-19");
            }
        };
        setDefaultConfiguration = function() {
            if (dateIsAfter(versions.v20161119, config.compatibility)) {
                config.rememberValidation = false;
                config.memoryPropertName = "__blueprints";
            } else {
                config.rememberValidation = true;
                config.memoryPropertName = "__interfaces";
            }
            config.onError = function(message) {
                console.log(message);
            };
        };
        Blueprint.types = [ "array", "blueprint", "bool", "boolean", "date", "datetime", "decimal", "expression", "function", "money", "nullOrWhitespace", "number", "object", "regexp", "string", "ObjectID" ];
        Blueprint.isValidatableProperty = function(obj) {
            if (!obj) {
                return false;
            }
            if (obj.__blueprintId || is.string(obj) && Blueprint.types.indexOf(obj) > -1 || is.string(obj.type) && Blueprint.types.indexOf(obj.type) > -1 || is.regexp(obj) || is.function(obj.validate)) {
                return true;
            }
            return false;
        };
        Blueprint.configure = function(cfg) {
            cfg = cfg || {};
            setDefaultCompatibility(cfg);
            setDefaultConfiguration();
            if (is.defined(cfg.rememberValidation)) {
                config.rememberValidation = cfg.rememberValidation;
            }
            if (is.function(cfg.onError)) {
                config.onError = cfg.onError;
            }
            return objectHelper.copyValue(config);
        };
        Blueprint.configure();
        return Blueprint;
    }
})();

(function() {
    "use strict";
    var locale = {
        errorTypes: {
            invalidArgumentException: "InvalidArgumentException",
            readOnlyViolation: "ReadOnlyViolation"
        },
        errors: {
            initialValidationFailed: "The argument passed to the constructor is not valid",
            validatePropertyInvalidArgs: "To validate a property, you must provide the instance, and property name"
        }
    }, mutatingArrayFunctions = [ "setPrototypeOf", "push", "pop", "sort", "splice", "shift", "unshift", "reverse" ], mutatingDateFunctions = [ "setPrototypeOf", "setDate", "setFullYear", "setHours", "setMilliseconds", "setMinutes", "setMonth", "setSeconds", "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes", "setUTCMonth", "setUTCSeconds", "setYear" ];
    if (typeof module !== "undefined" && module.exports) {
        module.exports = Factory({
            Blueprint: require("./Blueprint.js"),
            Exception: require("./Exception.js"),
            objectHelper: require("./objectHelper.js"),
            is: require("./is.js"),
            async: require("./async.js")
        });
    } else if (window && window.polyn) {
        window.polyn.addModule("Immutable", [ "async", "Blueprint", "is", "Exception", "objectHelper" ], Factory);
    } else {
        console.log(new Error("[POLYN] Unable to define module: UNKNOWN RUNTIME or POLYN NOT DEFINED"));
    }
    function Factory(polyn) {
        return new ImmutableFactory(polyn.Blueprint, polyn.Exception, polyn.objectHelper, polyn.is, polyn.async);
    }
    function ImmutableFactory(Blueprint, Exception, objectHelper, is, async) {
        var config = {
            onError: function(exception) {
                console.log(exception);
            }
        };
        function Immutable(originalSchema) {
            var schema = {}, blueprint, prop, propCtor;
            if (!originalSchema) {
                return new InvalidArgumentException(new Error("A schema object, and values are required"));
            }
            for (prop in originalSchema) {
                if (!originalSchema.hasOwnProperty(prop)) {
                    continue;
                } else if (prop === "__skipValidation") {
                    continue;
                } else if (prop === "__skipValdation") {
                    schema.__skipValidation = originalSchema.skipValdation;
                }
                if (is.object(originalSchema[prop]) && !Blueprint.isValidatableProperty(originalSchema[prop]) && !originalSchema[prop].__immutableCtor) {
                    schema[prop] = new Immutable(originalSchema[prop]);
                } else {
                    schema[prop] = originalSchema[prop];
                }
                if (schema[prop].__immutableCtor) {
                    propCtor = prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    Constructor[propCtor] = schema[prop];
                }
            }
            blueprint = new Blueprint(schema);
            function Constructor(values) {
                var propName, self = {};
                values = values || {};
                if (originalSchema.__skipValidation !== true && !Blueprint.validate(blueprint, values).result) {
                    var err = new InvalidArgumentException(new Error(locale.errors.initialValidationFailed), Blueprint.validate(blueprint, values).errors);
                    config.onError(err);
                    return err;
                }
                try {
                    for (propName in schema) {
                        if (!schema.hasOwnProperty(propName)) {
                            continue;
                        } else if (propName === "__blueprintId") {
                            continue;
                        }
                        if (is.nullOrUndefined(values[propName])) {
                            makeReadOnlyNullProperty(self, propName);
                            continue;
                        }
                        makeImmutableProperty(self, schema, values, propName);
                    }
                } catch (e) {
                    return new InvalidArgumentException(e);
                }
                return self;
            }
            setReadOnlyProp(Constructor, "merge", function(from, mergeVals, callback) {
                if (typeof callback === "function") {
                    async.runAsync(function() {
                        merge(Constructor, from, mergeVals, callback);
                    });
                } else {
                    var output;
                    merge(Constructor, from, mergeVals, function(err, merged) {
                        output = err || merged;
                    });
                    return output;
                }
            });
            setReadOnlyProp(Constructor, "toObject", function(from, callback) {
                return objectHelper.cloneObject(from, true, callback);
            });
            setReadOnlyProp(Constructor, "validate", function(instance, callback) {
                return Blueprint.validate(blueprint, instance, callback);
            });
            setReadOnlyProp(Constructor, "validateProperty", function(instance, propertyName, callback) {
                if (!instance && is.function(callback)) {
                    callback([ locale.errors.validatePropertyInvalidArgs ], false);
                } else if (!instance) {
                    return {
                        errors: [ locale.errors.validatePropertyInvalidArgs ],
                        result: false
                    };
                }
                return Blueprint.validateProperty(blueprint, propertyName, instance[propertyName], callback);
            });
            setReadOnlyProp(Constructor, "log", function(instance) {
                if (!instance) {
                    console.log(null);
                } else {
                    console.log(Constructor.toObject(instance));
                }
            });
            setReadOnlyProp(Constructor, "getSchema", function(callback) {
                return objectHelper.cloneObject(originalSchema, true, callback);
            });
            setReadOnlyProp(Constructor, "blueprint", blueprint);
            setReadOnlyProp(Constructor, "__immutableCtor", true);
            return Constructor;
        }
        function makeImmutableProperty(self, schema, values, propName) {
            var Model, mutatingFunctions, copy;
            if (schema[propName].__immutableCtor && is.function(schema[propName])) {
                Model = schema[propName];
                objectHelper.setReadOnlyProperty(self, propName, new Model(values[propName]), makeSetHandler(propName));
            } else if (Array.isArray(values[propName]) || isDate(values[propName])) {
                mutatingFunctions = Array.isArray(values[propName]) ? mutatingArrayFunctions : mutatingDateFunctions;
                copy = objectHelper.copyValue(values[propName]);
                mutatingFunctions.forEach(function(func) {
                    copy[func] = makeSetHandler(propName);
                });
                objectHelper.setReadOnlyProperty(self, propName, copy, makeSetHandler(propName));
            } else {
                objectHelper.setReadOnlyProperty(self, propName, objectHelper.copyValue(values[propName]), makeSetHandler(propName));
            }
        }
        function makeReadOnlyNullProperty(self, propName) {
            objectHelper.setReadOnlyProperty(self, propName, null, makeSetHandler(propName));
        }
        function makeSetHandler(propName) {
            return function() {
                var err = new Exception(locale.errorTypes.readOnlyViolation, new Error("Cannot set `" + propName + "`. This object is immutable"));
                config.onError(err);
                return err;
            };
        }
        function InvalidArgumentException(error, messages) {
            return new Exception(locale.errorTypes.invalidArgumentException, error, messages);
        }
        function setReadOnlyProp(obj, name, val) {
            objectHelper.setReadOnlyProperty(obj, name, val, function() {
                var err = new Exception(locale.errorTypes.readOnlyViolation, new Error(name + " is read-only"));
                config.onError(err);
                return err;
            });
        }
        function merge(Constructor, from, mergeVals, callback) {
            var mergedObj = objectHelper.merge(from, mergeVals), merged;
            if (mergedObj.isException) {
                return callback(mergedObj);
            }
            merged = new Constructor(mergedObj);
            if (merged.isException) {
                return callback(merged);
            } else {
                return callback(null, merged);
            }
        }
        function isDate(val) {
            return typeof val === "object" && Object.prototype.toString.call(val) === "[object Date]";
        }
        Immutable.configure = function(cfg) {
            cfg = cfg || {};
            if (is.function(cfg.onError)) {
                config.onError = cfg.onError;
            }
        };
        return Immutable;
    }
})();
