(function (register) {
    'use strict';

    register({
        name: 'HilaryModule-specs',
        Spec: Spec
    });

    function Spec (HilaryModule, expect, id, skip) {
        return {
            'HilaryModule.name': {
                'is required': skip(nameRequired),
                'must be a string': skip(nameMustBeString)
            },
            'HilaryModule.singleton': {
                'is NOT required': skip(singletonNotRequired),
                'must be a boolean': skip(singletonMustBeBoolean)
            },
            'HilaryModule.dependencies': {
                'is NOT required': skip(dependenciesNotRequired),
                'must be an array or FALSE': skip(dependenciesMustBeArrayOrFalse),
                'are generated if undefined, and factory takes arguments':
                    skip(dependenciesAreGeneratedIfUndefinedAndFactoryTakesArgs)
            },
            'HilaryModule.factory': {
                'is required': skip(factoryIsRequired),
                'can be an object': skip(factoryCanBeObject),
                'can be a primitive': skip(factoryCanBePrimitive),
                'can be a function': skip(factoryCanBeFunction),
                'can be an es6 class': skip(factoryCanBeEs6Class),
                'must have a function or class factory, if dependencies are defined':
                    skip(factoryMustHaveFactoryIfDependenciesAreDefined),
                'must have equal number of dependencies and factory args':
                    skip(factoryMustHaveEvenDependenciesAndFactoryArgs)
            },
        };

        function nameRequired () {}

        function nameMustBeString () {}

        function singletonNotRequired () {}

        function singletonMustBeBoolean () {}

        function dependenciesNotRequired () {}

        function dependenciesMustBeArrayOrFalse () {}

        function dependenciesAreGeneratedIfUndefinedAndFactoryTakesArgs () {}

        function factoryIsRequired () {}

        function factoryCanBeObject () {}

        function factoryCanBePrimitive () {}

        function factoryCanBeFunction () {}

        function factoryCanBeEs6Class () {}

        function factoryMustHaveFactoryIfDependenciesAreDefined () {}

        function factoryMustHaveEvenDependenciesAndFactoryArgs () {}

    } // /Spec

}(function (registration) {
    'use strict';

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = registration.Spec;
    } else if (typeof window !== 'undefined') {
        window.fixtures = window.fixtures || {};
        window.fixtures[registration.name] = registration.Spec;
    } else {
        throw new Error('[HILARY-TESTS] Unkown runtime environment');
    }
}));
