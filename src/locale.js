(function (register) {
    'use strict';

    register({
        name: 'locale',
        factory: {
            errorTypes: {
                INVALID_ARG: 'InvalidArgument',
                MODULE_NOT_FOUND: 'ModuleNotFound'
            },
            container: {
                CONSUMER_REQUIRED: 'A consumer function is required to `enumerate` over a container'
            },
            api: {
                REGISTER_ERR: 'register failed. see cause for more information',
                REGISTER_ARG: 'register expects either a hilary module, or an array of hilary modules as the first argument, but instead saw this: ',
                RESOLVE_ARG: 'resolve expects a moduleName (string) as the first argument, but instead saw this: ',
                MODULE_NOT_FOUND: 'The module, {{module}}, cannot be found, and is a dependency of, {{startingModule}}',
                MODULE_NOT_RESOLVABLE: 'The module, {{module}}, cannot be resolved because of a dependency exception, causing a ripple effect for, {{startingModule}}',
                MODULE_UNDEFINED: 'The following module was resolved but returned undefined: ',
                REGISTRATION_BLACK_LIST: 'A module was registered with a reserved name: ',
                PARENT_CONTAINER_ARG: 'setParentContainer expects the name of the parent scope, or an instance of Hilary'
            }
        }
    });

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