(function (register) {
    'use strict';

    register({
        name: 'register-resolve-degrade-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, id, skip) {
        return {
            'when a module is resolved,': {
                'it should gracefully degrade to require': skip(function () {

                }),
                'it should gracefully degrade to window': skip(function () {

                })
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
