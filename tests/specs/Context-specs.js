(function (register) {
    'use strict';

    register({
        name: 'Context-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, skip) {
        return {
            'when a new context is constructed,': {
                'it should use options.scope as the scope': skip(optionsScope),
                'it should use options.parent as the parent': skip(optionsParent),
                'it should add new containers': skip(containers),
                'it should be immutable': skip(isImmutable),
                'and options.scope is not defined,': {
                    'it should return an exception': skip(optionsScopeUndefined)
                },
                'and options.parent is not defined,': {
                    'it should NOT return an exception': skip(optionsParentUndefined)
                }
            },
            'when setParentScope is executed': {
                'and the arg is a string,': {
                    'it should NOT return an exception': skip(setParentScope)
                },
                'and the arg is NOT a string,': {
                    'it should return an exception': skip(setParentScopeBadArg)
                }
            }
        };

        function optionsScope () {}

        function optionsScopeUndefined () {}

        function optionsParent () {}

        function optionsParentUndefined () {}

        function containers () {}

        function isImmutable () {}

        function setParentScope () {}

        function setParentScopeBadArg () {}

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
