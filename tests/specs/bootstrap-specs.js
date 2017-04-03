(function (register) {
    'use strict';

    register({
        name: 'bootstrap-specs',
        Spec: Spec
    });

    function Spec (hilary, expect, id, skip) {
        return {
            'TODO': {
                'TODO': skip()
            }
        }
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
