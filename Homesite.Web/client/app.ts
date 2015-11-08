///<reference path="../typings/tsd.d.ts" />

module Root {
    var app = angular.module('root', [
        'ngResource',
        'ui.bootstrap',
        'ui.router',
        'root.directives',
        'root.filters',
        'root.services',
        'root.states',
        'root.templates',
    ]);

    angular.module('root.directives', []);
    angular.module('root.filters', []);
    angular.module('root.services', ['ngResource']);
    angular.module('root.states', ['ui.router']);
    angular.module('root.templates', []);

    //app.run([
    //    '$rootScope', '$state', (
    //        $rootScope: ng.IRootScopeService,
    //        $state: ng.ui.IStateService) => {

    //        // fix for a bug with angular-ui-router see https://github.com/angular-ui/ui-router/issues/1584
    //        $rootScope.$on('$stateChangeStart', (event: ng.IAngularEvent, toState: ng.ui.IState, params: {}) => {
    //            var redirect = toState.redirectTo;
    //            if (redirect) {
    //                event.preventDefault();
    //                $state.go(redirect, params);
    //            }
    //        });
    //    }]);

    app.config(['$httpProvider', ($httpProvider: ng.IHttpProvider) => {
        // combines multiple concurrent requests to run in one digest cycle
        $httpProvider.useApplyAsync(true);

        // transform outgoing requests to include access token
        //$httpProvider.interceptors.push('authenticationInterceptor');
    }]);
}

//declare module angular.ui {
//    interface IState {
//        redirectTo?: string;
//    }
//}