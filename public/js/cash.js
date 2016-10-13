var HomeViewModel = function() {
    var self = this;

    self.cashLoading = ko.observable(true);
    self.filtersLoading = ko.observable(true);
    
    self.formatCurrency = function(amount, currency) {
        var currencyOptions = self.currencyObj()[currency];
        return amount.toLocaleString(undefined, {minimumFractionDigits: currencyOptions.decimal_digits, maximumFractionDigits: currencyOptions.decimal_digits}) +
            ' ' +
            currency;
    };

    self.cash = ko.observableArray([]);
    self.isTransactionFee = ko.observable(false);
    self.savingWithdrawal = ko.observable(false);
    self.transactionFee = ko.observable().extend({
        gt: {
            val: 0,
            message: 'Value must be positive'
        },
        required: {
            val: true,
            message: "Please enter the transaction fee"
        },
        deferValidation: true
    });
    self.withdrawalAmount = ko.observable().extend({
        gt: {
            val: 0,
            message: 'Value must be positive'
        },
        required: {
            val: true,
            message: "Please enter the amount you withdrew from the ATM"
        },
        deferValidation: true
    });
    self.withdrawalDate = ko.observable(moment());
    self.withdrawalError = ko.observable();
    self.withdrawalCurrency = ko.observable();
    self.withdrawalType = ko.observable('atm');
    $('#withdrawalCurrency').on('change', function() {
        // Hacky way to make select2 observable
        self.withdrawalCurrency(this.value);
    });
    self.transactionFeeLabel = ko.computed(function() {
        var message = "Fee Amount";
        if(self.withdrawalCurrency()) {
            return message + " (in " + self.withdrawalCurrency() + ")";
        }
        return message;
    });
    self.canSubmitWithdrawal = ko.computed(function() {
        if(self.savingWithdrawal()) {
            return false;
        }
        if(self.withdrawalAmount.errors().length) {
            return false;
        }
        if(!self.withdrawalCurrency()) {
            return false;
        }
        if(!self.withdrawalDate()) {
            return false;
        }
        if(self.isTransactionFee() && self.transactionFee.errors().length) {
            return false;
        }
        return true;
    });

    self.saveWithdrawal = function() {
        self.savingWithdrawal(true);
        // self.cashReservesLoading(true);
        $.ajax({
            type: 'POST',
            url: '/withdrawal',
            data: {
                amount: self.withdrawalAmount(),
                date: self.withdrawalDate().toISOString(),
                isFee: self.isTransactionFee(),
                feeAmount: self.isTransactionFee() ? self.transactionFee() : 0,
                currency: self.withdrawalCurrency(),
                isEarnedCash: self.withdrawalType() == 'earned'
            },
            success: function(data) {
                data = JSON.parse(data);
                self.savingWithdrawal(false);
                // self.cashReservesLoading(false);
                if(data.error) {
                    self.withdrawalError("Error: " + data.error);
                    return;
                }
                $('#cashModal').modal('hide');
                self.isTransactionFee(false);
                self.withdrawalAmount(null);
                self.transactionFee(null);
                self.withdrawalError(null);
                self.withdrawalAmount.canValidate(false);
                self.transactionFee.canValidate(false);
                self.withdrawalDate(moment());
                self.setItem('lastWithdrawalCurrency', self.withdrawalCurrency());

                self.doSearch();
                // self.cashReserves(data);
            }
        });
    };
    self.totalResults = ko.observable(0);
    self.doSearch = function() {
        if(self.filtersLoading()) {
            return;
        }
        var qs = self.buildQueryString();
        $.ajax({
            type: 'GET',
            url: '/withdrawal' + (qs ? '?' + qs : ''),
            success: function(data) {
                try {
                    data = JSON.parse(data);
                    for(var i = 0; i < data.results.length; i++) {
                        data.results[i].showDetails = ko.observable(false);
                        data.results[i].detailsFetched = ko.observable(false);
                        data.results[i].details = ko.observableArray([]);
                        data.results[i].toggleRowDetails = function() {
                            var row = this;
                            row.showDetails(!row.showDetails());
                            if(row.detailsFetched()) {
                                return;
                            }
                            var filters = {
                                withdrawalId: row.id
                            };
                            var limit = 1000;
                            var url = '/transaction?limit=' + limit + '&filters=' + JSON.stringify(filters);
                            $.ajax({
                                type: 'GET',
                                url: url,
                                success: function(data) {
                                    try {
                                        data = JSON.parse(data);
                                    } catch(e) {
                                        console.log('Error: ' + data);
                                        data = [];
                                    }
                                    var transactionsByDate = {};
                                    for(var i = 0; i < data.results.length; i++) {
                                        var tr = data.results[i];
                                        if(!transactionsByDate[tr.date]) {
                                            transactionsByDate[tr.date] = [];
                                        }
                                        transactionsByDate[tr.date].push(tr);
                                    }
                                    var transactionArr = [];
                                    for(var key in transactionsByDate) {
                                        if(transactionsByDate.hasOwnProperty(key)) {
                                            transactionArr.push({
                                                date: key,
                                                transactions: transactionsByDate[key]
                                            });
                                        }
                                    }
                                    row.details(transactionArr);
                                    row.detailsFetched(true);
                                }
                            })
                        }
                    }
                    self.cash(data.results);
                    self.totalResults(data.count);
                } catch(e) {
                    self.cash([]);
                }
                self.cashLoading(false);
            }
        });
    };
    self.qsConcat = function(str1, str2) {
        return (str1 ? str1 + '&' + str2 : str2);
    }
    self.buildQueryString = function() {
        var qs = '';
        if(self.filters.limit() !== self.defaultLimit) {
            qs = self.qsConcat(qs, 'limit=' + self.filters.limit());
        }
        if(self.filters.page() !== 1) {
            qs = self.qsConcat(qs, 'page=' + self.filters.page());
        }
        if(self.sortField() != self.defaultSortField || self.sortOrder() != self.defaultSortOrder) {
            qs = self.qsConcat(qs, 'sort=' + encodeURIComponent(JSON.stringify({ order: self.sortOrder(), field: self.sortField() })));
        }
        return qs;
    };
    // Column Sorting
    self.defaultSortField = 'date';
    self.defaultSortOrder = 'desc';
    self.sortField = ko.observable(self.defaultSortField);
    self.sortOrder = ko.observable(self.defaultSortOrder);
    self.sort = function(field) {
        var swap = {
            'asc': 'desc',
            'desc': 'asc'
        };
        if(field == self.sortField()) {
            self.sortOrder(swap[self.sortOrder()]);
        }
        else {
            self.sortField(field);
            self.sortOrder('asc');
        }
        self.filters.page(1);
        self.doSearch();
    }
    /////////////////
    self.defaultLimit = 10;
    self.filters = {
        limitList: ko.observableArray([10, 25, 50]),
        limit: ko.observable(self.defaultLimit),
        page: ko.observable(1)
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
            sortOrder: self.sortOrder(),
            sortField: self.sortField()
        }, '', '/transactions' + (qs ? '?' + qs : ''));
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
        self.doSearch();
        return false;
    };

    window.onpopstate = function(e) {
        self.filtersLoading(true);
        if(e.state) {
            self.filters.limit(e.state.limit);
            self.sortField(e.state.sortField);
            self.sortOrder(e.state.sortOrder);
        }
        else {
            self.filters.limit(self.defaultLimit);
            self.sortField(self.defaultSortField);
            self.sortOrder(self.defaultSortOrder);
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
        var sort = self.getQueryVariable('sort');
        try {
            sort = JSON.parse(decodeURIComponent(sort));
        } catch(e) {
            sort = {};
        }
        if(sort.field) {
            self.sortField(sort.field);
        }
        if(sort.order) {
            self.sortOrder(sort.order);
        }
        self.filtersLoading(false);
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
};