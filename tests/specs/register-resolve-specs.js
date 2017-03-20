(function (register) {
    'use strict';

    register({
        name: 'hilary',
        Spec: Spec
    });

    function Spec (hilary, describe, when, it, xit, expect, fail) {
        describe('hilary', function () {
            when('a single module with no dependencies is registered with an object literal', function () {
                it('should be able to resolve modules', function () {
                    var registration,
                        actual;

                    // when
                    registration = hilary.register({ name: 'test', factory: { foo: 'bar' } });
                    actual = hilary.resolve('test');

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(actual.foo).to.equal('bar');
                });
            });

            when('a single module with no dependencies is registered with a function', function () {
                it('should be able to resolve modules', function () {
                    var scope = hilary.scope('af8454', { logging: { level: 'info' } }),
                        registration,
                        actual;

                    // when
                    registration = scope.register({ name: 'regfunc', factory: function () {
                        return { foo: 'bar' };
                    }});
                    actual = scope.resolve('regfunc');

                    // then
                    expect(registration.isException).to.equal(undefined);
                    expect(actual.foo).to.equal('bar');
                });
            });

            when('a single module with dependencies is registered', function () {
                it('should be able to resolve modules', function (done) {
                    var scope = hilary.scope('af84541', { logging: { level: 'info' } }),
                        registration1,
                        registration2,
                        registration3,
                        registration4;

                    // when
                    registration1 = scope.register({ name: 'regfunc1', factory: function () {
                        return { foo: 'bar' };
                    }});
                    registration2 = scope.register({
                        name: 'regfunc2',
                        dependencies: ['regfunc1'],
                        factory: function (f1) {
                            return {
                                f1: f1,
                                hello: 'world'
                            };
                        }
                    });
                    registration3 = scope.register({
                        name: 'regfunc3',
                        dependencies: ['regfunc1', 'regfunc2'],
                        factory: function (f1, f2) {
                            return {
                                f1: f1,
                                f2: f2,
                                chaka: 'khan'
                            };
                        }
                    });
                    registration4 = scope.register({
                        name: 'regfunc4',
                        dependencies: ['regfunc1', 'regfunc2', 'regfunc3'],
                        factory: function (f1, f2, f3) {
                            // then
                            expect(f1.foo).to.equal('bar');
                            expect(f2.hello).to.equal('world');
                            expect(f3.chaka).to.equal('khan');
                            expect(f2.f1.foo).to.equal('bar');
                            expect(f3.f1.foo).to.equal('bar');
                            expect(f3.f2.hello).to.equal('world');
                            done();
                            return true;
                        }
                    });

                    expect(registration1.isException).to.equal(undefined);
                    expect(registration2.isException).to.equal(undefined);
                    expect(registration3.isException).to.equal(undefined);
                    expect(registration4.isException).to.equal(undefined);
                    scope.resolve('regfunc4');
                });
            }); // /when

            when('a a module with a different number if dependencies and args is registered', function () {
                xit('should return an exception', function () {
                    // TODO
                    fail();
                });
            }); // /when
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
