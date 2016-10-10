var HomeViewModel = function() {
    var self = this;

    self.cashReservesLoading = ko.observable(true);
    self.trajectoryLoadng = ko.observable(true);
    self.transactionsLoading = ko.observable(true);
    
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
    self.isEarnedCash = ko.observable(false);
    self.openCashModal = function() {
        self.isEarnedCash(false);
        $('#cashModal').modal('show');
    };
    self.openCashModal = function() {
        self.isEarnedCash(true);
        $('#cashModal').modal('show');
    };
    self.cashModalTitleText = ko.computed(function() {
        return self.isEarnedCash() ? 'Record Earned Cash' : 'Record Withdrawal';
    });
    self.cashModalAmountText = ko.computed(function() {
        return self.isEarnedCash() ? 'Amount Earned' : 'Amount Withdrawn';
    });
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

    self.cashReserves = ko.observableArray([]);
    self.cashReservesClass = ko.computed(function() {
        return self.cashReserves() < 0 ? 'negative' : 'positive';
    });

    self.loadCashReserves = function() {
        self.cashReservesLoading(true);
        $.ajax({
            type: 'GET',
            url: '/cashReserves',
            success: function(data) {
                self.cashReserves(JSON.parse(data));
                self.cashReservesLoading(false);
            }
        })
    };

    self.formatCurrency = function(amount, currency) {
        var currencyOptions = self.currencyObj()[currency];
        return amount.toLocaleString(undefined, {minimumFractionDigits: currencyOptions.decimal_digits, maximumFractionDigits: currencyOptions.decimal_digits}) +
            ' ' +
            currency;
    };

    self.saveWithdrawal = function() {
        self.savingWithdrawal(true);
        self.cashReservesLoading(true);
        $.ajax({
            type: 'POST',
            url: '/withdrawal',
            data: {
                amount: self.withdrawalAmount(),
                date: self.withdrawalDate().toISOString(),
                isFee: self.isTransactionFee(),
                feeAmount: self.isTransactionFee() ? self.transactionFee() : 0,
                currency: self.withdrawalCurrency(),
                isEarnedCash: self.isEarnedCash()
            },
            success: function(data) {
                data = JSON.parse(data);
                self.savingWithdrawal(false);
                self.cashReservesLoading(false);
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

                self.cashReserves(data);
            }
        });
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

    self.loadRecentTransactions = function() {
        $.ajax({
            type: 'GET',
            url: '/transaction',
            success: function(data) {
                data = JSON.parse(data);
                self.transactions(data.results);
            }
        })
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
    self.loadCashReserves();
    self.loadRecentTransactions();
    self.loadCategories();
};