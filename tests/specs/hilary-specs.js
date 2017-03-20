(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (hilary, describe, when, it, xit, expect) {
        describe('hilary', function () {
            it('should have a default scope', function () {
                expectObjectToMeetHilaryApi(hilary);
            });

            when('a new scope is created', function () {
                it('should return an instance of Hilary', function () {
                    expectObjectToMeetHilaryApi(hilary.scope('myScope'));
                });

                it('should support options', function (done) {
                    var scope = hilary.scope('afkh5435', {
                        // logging: {
                        //     level: 'trace'
                        // },
                        onResolveUndefined: function (err) {
                            expect(err.isException).to.equal(true);
                            done();
                        }
                    });

                    scope.register({ name: 'nada', factory: function () {} });
                    scope.resolve('nada');
                });

                // it('should return register and resolve modules', function () {
                //     var scope = Hilary.scope('myScope');
                //     var registration = scope.register({ name: 'test', factory: { foo: 'bar' } });
                //     expect(registration.isException).to.equal(undefined);
                //     var actual = scope.resolve('test');
                //     expect(actual.foo).to.equal('bar');
                //
                // });
            });
        });

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
