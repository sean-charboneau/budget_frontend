var HomeViewModel = function() {
    var self = this;

    self.cashReservesLoading = ko.observable(true);
    self.trajectoryLoadng = ko.observable(true);
    self.transactionsLoading = ko.observable(true);
    
    self.isTransactionFee = ko.observable(false);
    self.savingWithdrawal = ko.observable(false);
    self.transactionFee = ko.observable();
    self.withdrawalAmount = ko.observable();
    self.withdrawalDate = ko.observable(moment());

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
                console.log(typeof JSON.parse(data));
                self.cashReserves(JSON.parse(data));
                console.log(self.cashReserves());
                self.cashReservesLoading(false);
            }
        })
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
                currency: $('.currency-dropdown').val()
            },
            success: function(data) {
                $('#withdrawalModal').modal('hide');
                self.savingWithdrawal(false);
                self.cashReservesLoading(false);
                self.isTransactionFee(false);
                self.withdrawalAmount(null);
                self.transactionFee(null);
                self.withdrawalDate(moment());
                console.log(data);
                self.cashReserves(JSON.parse(data));
            }
        });
    };

    self.loadCashReserves();
};