var SpendingViewModel = function() {
    var self = this;

    self.dataLoading = ko.observable(true);

    self.loadInitial = function() {
        
        setTimeout(function() {
            self.dataLoading(false);
            var config = {
                type: 'bar',
                // data: {
                //     labels: ["January", "February", "March", "April", "May", "June", "July"],
                //     datasets: [{
                //         label: 'Amount Spent',
                //         backgroundColor: 'rgba(43, 187, 173, 0.7)',
                //         borderColor: 'rgba(43, 187, 173, 1)',
                //         borderWidth: 1,
                //         data: [65, 20, 80, 81, 56, 85, 40],
                //     }]
                // },
                // data: {
                //     labels: ["2016", "2017"],
                //     datasets: [{
                //         label: 'Amount Spent',
                //         backgroundColor: 'rgba(43, 187, 173, 0.7)',
                //         borderColor: 'rgba(43, 187, 173, 1)',
                //         borderWidth: 1,
                //         data: [32000, 20000],
                //     }]
                // },
                data: {
                    labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
                    datasets: [{
                        label: 'Amount Spent',
                        backgroundColor: 'rgba(43, 187, 173, 0.7)',
                        borderColor: 'rgba(43, 187, 173, 1)',
                        borderWidth: 1,
                        data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
                    }]
                },
                options: {
                    legend: {
                        display: false
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            };

            var ctx = $('#over-time-chart');
            new Chart(ctx, config);
        },  2000);
    };
    
    self.formatCurrency = function(amount, currency) {
        var currencyOptions = self.currencyObj()[currency];
        return amount.toLocaleString(undefined, {minimumFractionDigits: currencyOptions.decimal_digits, maximumFractionDigits: currencyOptions.decimal_digits}) +
            ' ' +
            currency;
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
    self.loadInitial();
};