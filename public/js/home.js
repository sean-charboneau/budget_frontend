var HomeViewModel = function() {
    var self = this;

    self.cashLoading = ko.observable(true);
    self.trajectoryLoadng = ko.observable(true);
    self.transactionsLoading = ko.observable(true);

    self.cashReserves = ko.observable(0);
    self.cashReservesClass = ko.computed(function() {
        return self.cashReserves() < 0 ? 'negative' : 'positive';
    });
};