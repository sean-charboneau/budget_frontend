var SpendingViewModel = function() {
    var self = this;

    self.dataLoading = ko.observable(true);
    self.trips = ko.observableArray([]);
    self.categories = ko.observableArray([]);
    self.selectedTrip = ko.observable();
    self.selectedTrip.subscribe(function() {
        self.loadCategoriesForTrip();
    });
    self.selectedRange = ko.observable();

    self.loadSpendingData = function() {
        var categories = [1, 2, 3, 4, 5, 6, 7, 8]; // TODO dynamic
        var tripId = self.selectedTrip();
        var range = self.selectedRange();
        var qs = 'tripId=' + tripId + '&range=' + range + '&categories=' + JSON.stringify(categories);
        console.log(qs);
        $.ajax({
            type: 'GET',
            url: '/spendingData?' + qs,
            success: function(data) {
                data = JSON.parse(data);
                console.log(data);
                var labels = [];
                var dataPoints = [];
                for(var i = 0; i < data.length; i++) {
                    labels.push(moment(data[i].date).format('MMM D'));
                    dataPoints.push(data[i].spent_base);
                }

                var config = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Amount Spent',
                            backgroundColor: 'rgba(43, 187, 173, 0.7)',
                            borderColor: 'rgba(43, 187, 173, 1)',
                            borderWidth: 1,
                            data: dataPoints,
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
            }
        });

        


        // setTimeout(function() {
        //     self.dataLoading(false);
        //     
        // },  2000);
    };

    self.updateCategorySelect = function() {
        // TODO Actually update this
        console.log(self.categories());
        self.loadSpendingData();
    };

    self.updateTripSelect = function() {
        var select = $('#over-time-trip-select');
        select.material_select('destroy');
        select.empty();
        select.append($('<option>').attr('value', 'label').text('Select Trip').prop('disabled', true));
        
        for(var i = 0; i < self.trips().length; i++) {
            var trip = self.trips()[i];
            var option = $('<option>').attr('value', trip.id).text(trip.trip_name);
            if(self.trips()[i].is_active) {
                option = option.prop('selected', true);
            }
            select.append(option);
        }

        select.material_select();
    };

    self.loadCategoriesForTrip = function() {
        self.dataLoading(true);
        $.ajax({
            type: 'GET',
            url: '/categoriesForTrip?tripId=' + self.selectedTrip(),
            success: function(data) {
                self.categories(JSON.parse(data));
                self.updateCategorySelect();
                self.dataLoading(false);
            }
        });
    };

    self.loadTrips = function() {
        $.ajax({
            type: 'GET',
            url: '/trips',
            success: function(data) {
                self.trips(JSON.parse(data));
                self.updateTripSelect();
                self.dataLoading(false);
            }
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
    self.loadTrips();
};