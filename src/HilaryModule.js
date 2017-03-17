(function (register) {
    'use strict';

    register({
        name: 'HilaryModule',
        factory: HilaryModule
    });

    function HilaryModule (is, Immutable, objectHelper) {
        var IModule = new Immutable({
            __blueprintId: 'Hilary::HilaryModule',
            name: 'string',
            factory: {
                validate: function (val, errors) {
                    if (!val) {
                        errors.push('This implementation does not satisfy blueprint, Hilary::HilaryModule. It should have the property, factory.');
                    }
                }
            },
            isHilaryModule: 'boolean',
            singleton: {
                type: 'boolean',
                required: false
            },
            dependencies: {
                type: 'array',
                required: false
            }
        });

        return function (input) {
            input = input || {};
            input.isHilaryModule = true;
            // make modules singletons, by default
            input.singleton = is.boolean(input.singleton) ?
                input.singleton :
                true;

            if (is.not.defined(input.dependencies) && is.function(input.factory)) {
                // generate an array of dependency names from the arguments that
                // the factory accepts
                input.dependencies = objectHelper.getArgumentNames(input.factory);
            }

            return new IModule(input);
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
