(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (hilary, expect, id) {
        return {
            'when hilary is used without a scope': {
                'it should demonstrate the same API as a scope': function () {
                    expectObjectToMeetHilaryApi(hilary);
                }
            },
            'when a new scope is created': {
                'it should return an instance of hilary': function () {
                    expectObjectToMeetHilaryApi(hilary.scope(id.createUid(8)));
                },
                'it should support options': function () {
                    var logged,
                        scope = hilary.scope(id.createUid(8), {
                            logging: {
                                level: 'trace',
                                log: function () {
                                    logged = true;
                                }
                            }
                        });

                    scope.register({ name: 'nada', factory: function () {} });
                    // if the log function above was called, logged will be true,
                    // and we know that the options were accepted
                    expect(logged).to.equal(true);
                }
            }
        };

        function expectObjectToMeetHilaryApi (scope) {
            expect(typeof scope).to.equal('object');
            expect(scope.__isHilaryScope).to.equal(true);
            expect(typeof scope.context).to.equal('object');
            expect(typeof scope.register).to.equal('function');
            expect(typeof scope.resolve).to.equal('function');
            expect(typeof scope.exists).to.equal('function');
            expect(typeof scope.dispose).to.equal('function');
            expect(typeof scope.bootstrap).to.equal('function');
            expect(typeof scope.scope).to.equal('function');
            expect(typeof scope.setParentScope).to.equal('function');
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
