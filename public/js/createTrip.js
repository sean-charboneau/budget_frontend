var CreateTripViewModel = function() {
    var self = this;
    self.tripName = ko.observable();
    self.tripOneOffExpenses = ko.observableArray([]);
    self.tripOneOffExpensesAdded = 0;
    self.tripSegments = ko.observableArray([]);
    self.tripSegmentsAdded = 0;
    self.tripStartDate = ko.observable();

    self.detailsError = ko.observable('');
    self.segmentsError = ko.observable('');

    self.addSegment = function() {
        var newSegment = {
            id: self.tripSegmentsAdded,
            budget: ko.observable(150),
            country: ko.observable(),
            days: ko.observable(3),
            perDay: ko.observable(50),

            adjusting: ko.observable(false),
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
            summary: function() {
                return this.days() + (this.days() == 1 ? ' Day in ' : ' Days in ' + self.getNameForCountry(this.country()));
            },
            toggle: function() {
                this.expanded(!this.expanded());
            },
            toggleBudgetLock: function() {
                this.budgetLocked(!this.budgetLocked());
                if(this.budgetLocked()) {
                    this.daysLocked(false);
                    this.perDayLocked(false);
                }
            },
            toggleDaysLock: function() {
                this.daysLocked(!this.daysLocked());
                if(this.daysLocked()) {
                    this.budgetLocked(false);
                    this.perDayLocked(false);
                }
            },
            togglePerDayLock: function() {
                this.perDayLocked(!this.perDayLocked());
                if(this.perDayLocked()) {
                    this.daysLocked(false);
                    this.budgetLocked(false);
                }
            }
        };
        newSegment.days.subscribe(function(val) {
            if(newSegment.adjusting()) {
                return;
            }
            newSegment.adjusting(true);
            if(newSegment.budgetLocked()) {
                var newPerDay = self.formatCurrencyAmount(newSegment.budget() / newSegment.days(), self.user().base_currency);
                newSegment.perDay(newPerDay);
            }
            else {
                newSegment.budget(Math.floor(newSegment.perDay() * newSegment.days()));
            }
            newSegment.adjusting(false);
        });
        newSegment.budget.subscribe(function(val) {
            if(newSegment.adjusting()) {
                return;
            }
            newSegment.adjusting(true);
            if(newSegment.perDayLocked()) {
                newSegment.days(Math.ceil(newSegment.budget() / newSegment.perDay()));
            }
            else {
                var newPerDay = self.formatCurrencyAmount(newSegment.budget() / newSegment.days(), self.user().base_currency);
                newSegment.perDay(newPerDay);
            }
            newSegment.adjusting(false);
        });
        newSegment.perDay.subscribe(function(val) {
            if(newSegment.adjusting()) {
                return;
            }
            newSegment.adjusting(true);
            if(newSegment.daysLocked()) {
                newSegment.budget(Math.floor(newSegment.perDay() * newSegment.days()));
            }
            else {
                newSegment.days(Math.ceil(newSegment.budget() / newSegment.perDay()));
            }
            newSegment.adjusting(false);
        });
        self.tripSegmentsAdded++;
        self.tripSegments.push(newSegment);
        self.initCountryDropdown();
    };

    self.deleteSegment = function(id) {
        for(var i = 0; i < self.tripSegments().length; i++) {
            console.log(self.tripSegments()[i].id);
            if(self.tripSegments()[i].id == id) {
                console.log('deleting');
                self.tripSegments.splice(i, 1);
                return;
            }
        }
    };

    self.deleteOneOffExpense = function(id) {
        for(var i = 0; i < self.tripOneOffExpenses().length; i++) {
            if(self.tripOneOffExpenses()[i].id == id) {
                self.tripOneOffExpenses.splice(i, 1);
                return;
            }
        }
    }

    self.addOneOff = function() {
        var newOneOff = {
            id: self.tripOneOffExpensesAdded,
            title: ko.observable(),
            amount: ko.observable(),
            expanded: ko.observable(true),

            getText: function() {
                var amountString = self.formatCurrency(this.amount(), self.user().base_currency);
                return (this.title() || 'Expense') + ' - ' + amountString;
            },
            toggle: function() {
                this.expanded(!this.expanded());
            }
        };

        self.tripOneOffExpensesAdded++;
        self.tripOneOffExpenses.push(newOneOff);
    };

    self.getTotalBudget = function() {
        var total = 0;
        for(var i = 0; i < self.tripOneOffExpenses().length; i++) {
            total += parseFloat(self.tripOneOffExpenses()[i].amount() || 0);
        }
        for(var i = 0; i < self.tripSegments().length; i++) {
            total += parseFloat(self.tripSegments()[i].budget() || 0);
        }
        return total;
    };

    self.getTotalBudgetText = function() {
        return self.formatCurrencyShort(self.getTotalBudget(), self.user().base_currency);
    };
    
    self.saveTrip = function() {
        self.detailsError('');
        self.segmentsError('');

        if(!self.tripName() && !self.tripStartDate()) {
            self.detailsError('Please enter a trip name and start date');
        }
        else if(!self.tripName()) {
            self.detailsError('Please enter a trip name');
        }
        else if(!self.tripStartDate()) {
            self.detailsError('Please enter a start date');
        }

        if(!self.tripSegments().length) {
            self.segmentsError('Please enter at least one trip segment');
        }

        if(self.detailsError() || self.segmentsError()) {
            $("html, body").animate({ scrollTop: 0 }, "slow");
            return;
        }
        
        $.ajax({
            type: 'POST',
            url: '/trip',
            data: {
                currency: self.user().base_currency,
                name: self.tripName(),
                startDate: moment(self.tripStartDate()).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ'),
                segments: ko.toJSON(self.tripSegments),
                oneOffExpenses: ko.toJSON(self.tripOneOffExpenses)
            },
            success: function(data) {
                document.location = '/home';
            }
        });
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

    self.formatCurrencyShort = function(amount, currency) {
        return self.currencyObj()[currency].symbol_native + self.formatCurrencyAmount(amount, currency);
    };

    self.formatCurrencyAmount = function(amount, currency) {
        var currencyOptions = self.currencyObj()[currency];
        return parseFloat(amount || 0).toLocaleString(undefined, {minimumFractionDigits: currencyOptions.decimal_digits, maximumFractionDigits: currencyOptions.decimal_digits});
    };

    self.formatCurrency = function(amount, currency) {
         return self.formatCurrencyAmount(amount, currency) +
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

    self.getQueryVariable = function(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable) {
                return pair[1];
            }
        }
        return(false);
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
    };

    self.getItem = function(item) {
        if (typeof(Storage) !== "undefined") {
            return localStorage.getItem(item);
        } else {
            console.log('No support for localStorage in browser.');
            return null;
        }
    };

    if(self.getQueryVariable('first')) {
        swal('Welcome!', 'Let\'s start by setting up your trip');
    }
};