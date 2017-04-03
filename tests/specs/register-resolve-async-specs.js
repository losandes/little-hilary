(function (register) {
    'use strict';

    register({
        name: 'register-resolve-async-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, id, skip) {
        return {
            'when a module is registerd (async),': {
                'it should execute the callback': skip(),
                'and an error was encountered': {
                    'it should pass the error as the first arg to the callback': skip()
                }
            },
            'when a module is resolved (async),': {
                'it should execute the callback': skip(),
                'and an error was encountered': {
                    'it should pass the error as the first arg to the callback': skip()
                }                
            }
        };
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
