(function (register) {
    'use strict';

    register({
        name: 'Context',
        factory: Context
    });

    function Context(Immutable, Container) {
        var IContext = new Immutable({
            scope: 'string',
            parent: 'string',
            container: 'object',
            singletonContainer: 'object'
        });

        return function (options) {
            var context = new IContext({
                scope: options.scope,
                parent: options.parent,
                container: new Container(),
                singletonContainer: new Container()
            });

            context.setParentContainer = function (parent) {
                return IContext.merge({ parent: parent });
            };

            return context;
        };
    }

}(function (registration) {
    'use strict';

    try {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = registration.factory;
        } else if (typeof window !== 'undefined') {
            window.__hilary = window.__hilary || {};
            window.__hilary[registration.name] = registration.factory;
        } else {
            throw new Error('[HILARY] Unkown runtime environment');
        }
    } catch (e) {
        var name = registration && registration.name ? registration.name : 'MISSING NAME';
        var err = new Error('[HILARY] Registration failure: ' + name);
        err.cause = e;
        throw err;
    }
}));
