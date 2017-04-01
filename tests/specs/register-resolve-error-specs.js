(function (register) {
    'use strict';

    register({
        name: 'register-resolve-error-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, skip) {
        return {
            // TODO
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
