var CreateTripViewModel = function() {
    var self = this;
    self.tripStartDate = ko.observable();
    self.tripSegments = ko.observableArray([]);

    self.addSegment = function() {
        self.tripSegments.push({
            budget: ko.observable(1500),
            country: ko.observable(),
            days: ko.observable(30),
            expanded: ko.observable(true),

            budgetLocked: ko.observable(false),
            daysLocked: ko.observable(false),
            perDayLocked: ko.observable(false),

            getBudgetText: function() {
                var d = this.days() == 0 ? 1 : this.days();
                var perDay = this.budget() / d;
                var pdString = self.formatCurrency(perDay, self.user().base_currency);
                return this.days() + ' Days -- ' + pdString + '/Day';
            },
            toggle: function() {
                this.expanded(!this.expanded());
            },
            toggleDaysLock: function() {
                this.daysLocked(!this.daysLocked());
            }
        });
        var handlesSlider = document.getElementById('my-slider');

        noUiSlider.create(handlesSlider, {
            start: [ 30 ],
            range: {
                'min': [  1 ],
                'max': [ 365 ]
            }
        });
        handlesSlider.noUiSlider.on('update', function(val) {
            console.log(Math.floor(val[0]));
        });
        self.initCountryDropdown();
    };

    self.initCountryDropdown = function() {
        var formatCountryOption = function(item) {
            var code = item.id || '_unknown';
            if(noImage.indexOf(code) > -1) {
                code = '_unknown';
            }
            var $item = $(
                '<span><img src="images/flags/16/' + code + '.png" class="img-flag" /> ' + item.name + '</span>'
            );
            return $item;
        };

        $('.country-dropdown').select2({
            data: vm.countryArr(),
            matcher: function(params, data) {
                var term = $.trim(params.term);
                if (term === '') {
                    return data;
                }
                if(data.id === '') {
                    return null;
                }
                if(data.name.toUpperCase().indexOf(term.toUpperCase()) > -1) {
                    return data;
                }
                if(data.native.toUpperCase().indexOf(term.toUpperCase()) > -1) {
                    return data;
                }
                return null;
            },
            placeholder: {
                id: '',
                name: 'Select Country',
                icon: '_unknown'
            },
            templateResult: formatCountryOption,
            templateSelection: formatCountryOption,
            theme: 'bootstrap'
        });
    };

    self.formatCurrency = function(amount, currency) {
        var currencyOptions = self.currencyObj()[currency];
        return amount.toLocaleString(undefined, {minimumFractionDigits: currencyOptions.decimal_digits, maximumFractionDigits: currencyOptions.decimal_digits}) +
            ' ' +
            currency;
    };

    self.getIconForCountry = function(country) {
        if(!country) {
            return 'images/flags/32/_unknown.png';
        }
        return 'images/flags/32/' + self.countryObj().countries[country].icon + '.png';
    };

    self.getNameForCountry = function(country) {
        if(!country) {
            return 'World';
        }
        return self.countryObj().countries[country].name;
    };

    self.toTitleCase = function(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    self.setItem = function(item, value) {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem(item, value);
        } else {
            console.log('No support for localStorage in browser.');
        }
    }

    self.getItem = function(item) {
        if (typeof(Storage) !== "undefined") {
            return localStorage.getItem(item);
        } else {
            console.log('No support for localStorage in browser.');
            return null;
        }
    }
};