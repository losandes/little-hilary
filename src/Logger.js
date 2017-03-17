(function (register) {
    'use strict';

    register({
        name: 'Logger',
        factory: Logger
    });

    function Logger (is) {
        return function (options) {
            var self = {
                trace: function () { log(10, arguments); },
                debug: function () { log(20, arguments); },
                info:  function () { log(30, arguments); },
                warn:  function () { log(40, arguments); },
                error: function () { log(50, arguments); },
                fatal: function () { log(60, arguments); },
            };

            options = new Options(options);

            function log (level, args) {
                var printer;

                if (level < options.level) {
                    return;
                }

                switch(level) {
                    case 60:
                        printer = console.error || console.log;
                        break;
                    case 50:
                        printer = console.error || console.log;
                        break;
                    case 40:
                        printer = console.warn || console.log;
                        break;
                    default:
                        printer = console.log;
                        break;
                }

                printer.apply(null, args);
            }

            return self;
        };

        function Options (options) {
            var level;

            if (typeof options === 'string') {
                options = {};
            } else {
                options = options || {};
            }

            options.logging = options.logging || {};

            if (options.logging.level && is.string(options.logging.level)) {
                switch (options.logging.level) {
                    case 'debug': level = 20; break;
                    case 'info': level = 30; break;
                    case 'warn': level = 40; break;
                    case 'error': level = 50; break;
                    case 'fatal': level = 60; break;
                    case 'off': level = 70; break;
                    default: level = 10; break;
                }
            } else if (
                options.logging.level &&
                is.number(options.logging.level) &&
                options.logging.level > 0 &&
                options.logging.level <= 70
            ) {
                level = options.logging.level;
            } else {
                level = 30;
            }

            return {
                level: level
            };
        }
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
