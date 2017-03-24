(function (register) {
    'use strict';

    register({
        name: 'hilary-specs',
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
                'it should use the given name': function () {
                    var name = id.createUid(8),
                        scope = hilary.scope(name);

                    expect(scope.context.scope).to.equal(name);
                },
                'it should generate a name for the scope, if not name is presented': function () {
                    var scope = hilary.scope();
                    expectObjectToMeetHilaryApi(scope);
                    expect(typeof scope.context.scope).to.equal('string');
                },
                'it should support options': function () {
                    var logged,
                        parent = hilary.scope(),
                        scope = hilary.scope(id.createUid(8), {
                            parent: parent,
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
                    expect(scope.context.parent).to.equal(parent.context.scope);
                },
                'it should have "default" as the parent scope': function () {
                    var scope = hilary.scope();
                    expect(scope.context.parent).to.equal('default');
                }
            },
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
