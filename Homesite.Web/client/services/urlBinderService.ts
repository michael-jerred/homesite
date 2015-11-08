///<reference path="../../typings/tsd.d.ts"/>

module Root.Services.UrlBinder {
    export interface IUrlBinderService {
        bind<T extends string | number | boolean>(
            scope: ng.IScope,
            urlParamName: string,
            getValue: (scope: ng.IScope) => T,
            setValue: (value: string) => void,
            initialValue?: T): any;

        bindArray(
            scope: ng.IScope,
            urlParamName: string,
            getValues: (scope: ng.IScope) => string[],
            setValues: (value: string[]) => void,
            initialValues?: string[]): any;
    }

    class Service implements IUrlBinderService {
        static $inject = ['$location'];
        constructor(private $location: ng.ILocationService) {
        }

        public bind<T extends string | number | boolean>(
            scope: ng.IScope,
            urlParamName: string,
            getValue: (scope: ng.IScope) => T,
            setValue: (value: T) => void,
            initialValue?: T) {

            if (initialValue) {
                setValue(initialValue);
            }

            // bind variable to URL
            scope.$watch(getValue, (newValue: any) => {
                this.$location.search(urlParamName, newValue);
            });

            // bind URL to variable
            scope.$on('$locationChangeSuccess', () => {
                var value = this.$location.search()[urlParamName];
                setValue(value);
            });
        }

        public bindArray(
            scope: ng.IScope,
            urlParamName: string,
            getValues: (scope: ng.IScope) => string[],
            setValues: (value: string[]) => void,
            initialValues?: string[]) {

            if (initialValues) {
                setValues(initialValues);
            }

            // bind variable to URL
            scope.$watchCollection(getValues, (newValues) => {
                this.$location.search(urlParamName, newValues);
            });

            // bind URL to variable
            scope.$on('$locationChangeSuccess', () => {
                var values = this.$location.search()[urlParamName];
                setValues(angular.isArray(values) ? values : [values]);
            });
        }
    }

    angular.module('root.services').service('urlBinderService', Service);
}