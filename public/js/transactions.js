var HomeViewModel = function() {
    var self = this;

    self.transactionsLoading = ko.observable(true);
    self.filtersLoading = ko.observable(true);
    
    self.formatCurrency = function(amount, currency) {
        var currencyOptions = self.currencyObj()[currency];
        return amount.toLocaleString(undefined, {minimumFractionDigits: currencyOptions.decimal_digits, maximumFractionDigits: currencyOptions.decimal_digits}) +
            ' ' +
            currency;
    };

    self.transactions = ko.observableArray([]);
    self.transactionError = ko.observable();
    self.savingTransaction = ko.observable(false);
    self.transactionType = ko.observable('cash');
    self.transactionAmount = ko.observable().extend({
        gt: {
            val: 0,
            message: 'Value must be positive'
        },
        required: {
            val: true,
            message: "Please enter the transaction amount"
        },
        deferValidation: true
    });
    self.transactionCurrency = ko.observable();
    $('#transactionCurrency').on('change', function() {
        // Hacky way to make select2 observable
        self.transactionCurrency(this.value);
    });
    self.transactionCountry = ko.observable();
    $('#transactionCountry').on('change', function() {
        // Hacky way to make select2 observable
        self.transactionCountry(this.value);
    });
    self.transactionDate = ko.observable(moment());
    self.transactionSplit = ko.observable(false);
    self.transactionEnd = ko.observable(moment());
    self.transactionDateLabel = ko.computed(function() {
        return self.transactionSplit() ? 'Start Date' : 'Date';
    });
    self.toggleTransactionSplit = function() {
        self.transactionSplit(!self.transactionSplit());
    };
    self.transactionSplitText = ko.computed(function() {
        return self.transactionSplit() ? 'Use single date' : 'Split transaction over a range of dates';
    });
    self.transactionDescription = ko.observable('');
    self.descriptionRemainingLength = ko.computed(function() {
        return self.transactionDescription() ? self.transactionDescription().length + '/255' : '';
    });

    self.categoriesLoading = ko.observable(false);
    self.categories = ko.observableArray([]);
    self.selectedCategory = ko.observable();
    self.loadCategories = function() {
        self.categoriesLoading(true);
        $.ajax({
            type: 'GET',
            url: '/categories',
            success: function(data) {
                self.categories(JSON.parse(data));
                self.categoriesLoading(false);
            }
        })
    };
    self.getCategoryById = function(id) {
        for(var i = 0; i < self.categories().length; i++) {
            if(self.categories()[i].id == id) {
                console.log(self.categories()[i]);
                return self.categories()[i];
            }
        }
    }
    self.categoryClicked = function(item, event) {
        var categoryId = $(event.currentTarget).find('input').val();
        self.selectedCategory(self.getCategoryById(categoryId));
    };
    self.unassociatedTransaction = ko.observable(false);
    self.canSubmitTransaction = ko.computed(function() {
        if(self.savingTransaction()) {
            return false;
        }
        if(self.transactionAmount.errors().length) {
            return false;
        }
        if(!self.transactionCurrency()) {
            return false;
        }
        if(!self.transactionDate()) {
            return false;
        }
        if(!self.selectedCategory()) {
            return false;
        }
        if(!self.unassociatedTransaction() && !self.transactionCountry()) {
            return false;
        }
        if(!self.selectedCategory()) {
            return false;
        }
        return true;
    });

    self.saveTransaction = function() {
        self.savingTransaction(true);
        self.transactionsLoading(true);
        var body = {
            type: self.transactionType(),
            amount: self.transactionAmount(),
            currency: self.transactionCurrency(),
            date: self.transactionDate().toISOString(),
            categoryId: self.selectedCategory().id,
            description: self.transactionDescription()
        };
        if(self.transactionSplit()) {
            body.endDate = self.transactionEnd().toISOString();
        }
        if(!self.unassociatedTransaction()) {
            body.country = self.transactionCountry();
        }
        $.ajax({
            type: 'POST',
            url: '/transaction',
            data: body,
            success: function(data) {
                data = JSON.parse(data);
                console.log(data);
                self.savingTransaction(false);
                self.transactionsLoading(false);
                if(data.error) {
                    self.transactionError("Error: " + data.error);
                    return;
                }
                $('#transactionModal').modal('hide');
                self.transactionAmount(null);
                self.transactionError(null);
                self.transactionAmount.canValidate(false);
                self.transactionDate(moment());
                self.transactionEnd(moment());
                self.unassociatedTransaction(false);
                self.transactionSplit(false);
                self.setItem('lastTransactionCurrency', self.transactionCurrency());
                self.setItem('lastTransactionCountry', self.transactionCountry());

                self.transactions(data);
                self.loadCashReserves();
            }
        });
    };

    self.totalResults = ko.observable(0);
    self.doSearch = function() {
        if(self.filtersLoading()) {
            return;
        }
        self.transactionsLoading(true);
        var qs = self.buildQueryString();
        console.log('/transaction' + (qs ? '?' + qs : ''));
        $.ajax({
            type: 'GET',
            url: '/transaction' + (qs ? '?' + qs : ''),
            success: function(data) {
                try {
                    data = JSON.parse(data);
                    console.log(data);
                    self.transactions(data.results);
                    self.totalResults(data.count);
                } catch(e) {
                    self.transactions([]);
                }
                self.transactionsLoading(false);
            }
        });
    };
    self.qsConcat = function(str1, str2) {
        return (str1 ? str1 + '&' + str2 : str2);
    }
    self.buildQueryString = function() {
        var qs = '';
        var filtersActive = false;
        var filterObj = {};
        if(self.filters.limit() !== self.defaultLimit) {
            qs = self.qsConcat(qs, 'limit=' + self.filters.limit());
        }
        if(self.filters.page() !== 1) {
            qs = self.qsConcat(qs, 'page=' + self.filters.page());
        }
        if(self.filters.withdrawalId()) {
            filterObj.withdrawalId = self.filters.withdrawalId();
            filtersActive = true;
        }
        if(filtersActive) {
            qs = self.qsConcat(qs, 'filters=' + JSON.stringify(filterObj));
        }
        return qs;
    };
    self.defaultLimit = 10;
    self.filters = {
        limitList: ko.observableArray([10, 25, 50]),
        limit: ko.observable(self.defaultLimit),
        page: ko.observable(1),
        withdrawalId: ko.observable()
    };
    self.filters.limit.subscribe(function(val) {
        if(self.filtersLoading()) {
            return;
        }
        self.filters.page(1);
        var qs = self.buildQueryString();
        history.pushState({
            id: 'filters',
            limit: self.filters.limit(),
            withdrawalId: self.filters.withdrawalId()
        }, '', '/transactions' + (qs ? '?' + qs : ''));
        console.log('change');
        self.doSearch();
    });
    self.pageDisplayText = ko.computed(function() {
        if(!self.totalResults()) {
            return '';
        }
        var page = self.filters.page();
        var limit = self.filters.limit();
        var total = self.totalResults();

        return 'Displaying ' + (page * limit - limit + 1) + ' - ' + Math.min((page * limit), total) + ' of ' + total + ' results';
    });
    self.navigate = function(page) {
        console.log(page);
        var lastPage = Math.ceil(self.totalResults() / self.filters.limit());
        if(page == 'first') {
            self.filters.page(1);
        }
        if(page == 'prev') {
            self.filters.page(Math.max(self.filters.page() - 1, 1));
        }
        if(page == 'next') {
            self.filters.page(Math.min(lastPage, self.filters.page() + 1));
        }
        if(page == 'last') {
            self.filters.page(lastPage);
        }
        console.log(self.filters.page());
        self.doSearch();
        return false;
    };

    window.onpopstate = function(e) {
        self.filtersLoading(true);
        if(e.state) {
            self.filters.limit(e.state.limit);
            self.filters.withdrawalId(e.state.withdrawalId);
        }
        else {
            self.filters.limit(self.defaultLimit);
            self.filters.withdrawalId(null);
        }
        self.filtersLoading(false);
        self.doSearch();
    };

    self.loadFiltersFromUrl = function() {
        var limit = self.getQueryVariable('limit');
        if(limit) {
            try {
                self.filters.limit(parseInt(limit));
            } catch(e) {}
        }
        var filters = self.getQueryVariable('filters');
        console.log(filters);
        try {
            filters = JSON.parse(decodeURIComponent(filters));
            console.log(filters);
        } catch(e) {
            filters = {};
        }
        if(filters.withdrawalId) {
            try {
                self.filters.withdrawalId(parseInt(filters.withdrawalId));
            } catch(e) {}
        }
        self.filtersLoading(false);
        console.log('done loading filters');
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

    self.getIconForCountry = function(country) {
        if(!country) {
            return 'images/flags/16/_unknown.png';
        }
        return 'images/flags/16/' + self.countryObj().countries[country].icon + '.png';
    };

    self.getNameForCountry = function(country) {
        if(!country) {
            return 'Unassociated';
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
    self.loadFiltersFromUrl();
    self.doSearch();
    self.loadCategories();
};