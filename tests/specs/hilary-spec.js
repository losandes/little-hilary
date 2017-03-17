(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (Hilary, describe, when, it, xit, expect) {
        describe('Hilary', function () {
            when('a new scope is created', function () {
                it('should return an instance of Hilary', function () {
                    var scope = Hilary.scope('myScope');
                    expect(typeof scope).to.equal('object');
                    expect(typeof scope.register).to.equal('function');
                    expect(typeof scope.resolve).to.equal('function');
                });
            });
        });
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
