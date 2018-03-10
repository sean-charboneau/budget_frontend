var SpendingViewModel = function() {
    var self = this;

    self.chartObj = null;

    self.trips = ko.observableArray([]);
    self.graphColors = ['#009688', '#2196f3', '#3f51b5', '#673ab7', '#f44336', '#4caf50', '#ff9800', '#ffeb3b'];

    self.optionsLoading = ko.observable(true);

    self.categories = ko.observableArray([]);
    self.selectedCategories = ko.observableArray([]);
    self.displayCategorySelect = ko.observable(true);

    self.selectedTrip = ko.observable();
    self.selectedTrip.subscribe(function() {
        self.loadCategoriesForTrip();
    });

    self.defaultTrip = ko.observable();

    self.selectedRange = ko.observable();
    self.selectedRange.subscribe(function() {
        if(!self.optionsLoading()) {
            self.loadSpendingData();
        }
    });

    self.loadSpendingData = function(first) {
        if((!self.selectedTrip() && !self.defaultTrip()) || !self.selectedRange()) {
            return;
        }

        if(self.selectedTab() == '#over-time' || first) {
            self.loadSpendingDataOverTime();
        }
        else if(self.selectedTab() == '#by-country') {
            self.loadSpendingDataByCountry();
        }
        else if(self.selectedTab() == '#by-category') {
            self.loadSpendingDataByCategory();
        }
    };

    self.loadSpendingDataOverTime = function() {
        var categories = self.selectedCategories();
        var tripId = self.selectedTrip() || self.defaultTrip();
        var range = self.selectedRange();
        var qs = 'graphType=overTime&tripId=' + tripId + '&range=' + range + '&categories=' + JSON.stringify(categories);
        $.ajax({
            type: 'GET',
            url: '/spendingData?' + qs,
            success: function(data) {
                var ctx = $('#chart');
                data = JSON.parse(data);
                var labels = [];
                var dataPoints = [];
                for(var i = 0; i < data.length; i++) {
                    labels.push(moment(data[i].date).format('YYYY-MM-DD'));
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
                                    beginAtZero: true,
                                    callback: function(value, index, values) {
                                        return self.formatCurrencyShort(value, self.user().base_currency)
                                    }
                                }
                            }]
                        },
                        hover: {
                            onHover: function(event, elements) {
                                ctx.css("cursor", elements[0] ? "pointer" : "default");
                            }
                        },
                        onClick: function(event, elements) {
                            // TODO: Don't love having this tied to the label.
                            //       Figure out a way to pass arbitrary data
                            var date = elements[0]._model.label;
                            window.location = "/transactions?filters=" + encodeURIComponent(JSON.stringify({dateStart: date, dateEnd: date}))
                        }
                    }
                };

                if(self.chartObj) {
                    self.chartObj.destroy();
                }
                ctx.parent().removeClass('doughnut');
                self.chartObj = new Chart(ctx, config);
            }
        });
    };

    self.loadSpendingDataByCountry = function() {
        var tripId = self.selectedTrip() || self.defaultTrip();
        var range = self.selectedRange();
        var qs = 'graphType=byCountry&tripId=' + tripId + '&range=' + range;
        $.ajax({
            type: 'GET',
            url: '/spendingData?' + qs,
            success: function(data) {
                data = JSON.parse(data);

                var labels = [];
                var dataPoints = [];
                var colors = [];
                
                for(var i = 0; i < data.length; i++) {
                    var code = '';
                    if(data[i].country) {
                        code = ' (' + data[i].country + ')'
                    }
                    labels.push(self.getNameForCountry(data[i].country) + code);
                    dataPoints.push(data[i].spent_base);
                    colors.push(self.graphColors[i % self.graphColors.length]);
                }

                var config = {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            // label: 'Amount Spent',
                            backgroundColor: colors,
                            data: dataPoints
                        }]
                    },
                    options: {
                        hover: {
                            onHover: function(event, elements) {
                                ctx.css("cursor", elements[0] ? "pointer" : "default");
                            }
                        },
                        onClick: function(event, elements) {
                            // TODO: Don't love having this tied to the label.
                            //       Figure out a way to pass arbitrary data
                            var country = '';
                            var countryMatch = elements[0]._model.label.match(/\(([^)]+)\)/);
                            if(countryMatch &&  countryMatch.length > 1) {
                                country = countryMatch[1];
                            }
                            if(!country) {
                                // Unassigned transactions
                                country = 'XX';
                            }
                            window.location = "/transactions?filters=" + encodeURIComponent(JSON.stringify({country: country}))
                        }
                    }
                };

                if(self.chartObj) {
                    self.chartObj.destroy();
                }
                var ctx = $('#chart');
                ctx.parent().addClass('doughnut');
                self.chartObj = new Chart(ctx, config);
            }
        });
    };

    self.loadSpendingDataByCategory = function() {
        var tripId = self.selectedTrip() || self.defaultTrip();
        var range = self.selectedRange();
        var qs = 'graphType=byCategory&tripId=' + tripId + '&range=' + range;
        $.ajax({
            type: 'GET',
            url: '/spendingData?' + qs,
            success: function(data) {
                data = JSON.parse(data);

                var labels = [];
                var dataPoints = [];
                var colors = [];
                
                for(var i = 0; i < data.length; i++) {
                    labels.push(self.toTitleCase(data[i].category));
                    dataPoints.push(data[i].spent_base);
                    colors.push(self.graphColors[i % self.graphColors.length]);
                }

                var config = {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            backgroundColor: colors,
                            data: dataPoints
                        }]
                    },
                    options: {
                        hover: {
                            onHover: function(event, elements) {
                                ctx.css("cursor", elements[0] ? "pointer" : "default");
                            }
                        },
                        onClick: function(event, elements) {
                            // TODO: Don't love having this tied to the label.
                            //       Figure out a way to pass arbitrary data
                            //       Especially true here; custom categories would break this
                            var category = elements[0]._model.label;
                            window.location = "/transactions?filters=" + encodeURIComponent(JSON.stringify({categoryName: category.toLowerCase()}))
                        }
                    }
                };

                if(self.chartObj) {
                    self.chartObj.destroy();
                }
                var ctx = $('#chart');
                ctx.parent().addClass('doughnut');
                self.chartObj = new Chart(ctx, config);
            }
        });
    };

    self.updateCategorySelect = function() {
        self.selectedCategories([]);
        var select = $('#category-select');
        select.material_select('destroy');
        select.empty();
        select.append($('<option>').attr('value', 'label').text('Select Categories').prop('disabled', true));
        
        for(var i = 0; i < self.categories().length; i++) {
            var category = self.categories()[i];
            var option = $('<option>').attr('value', category.id).text(self.toTitleCase(category.category));
            if(category.category != 'one-off expense') {
                option = option.prop('selected', true);
                self.selectedCategories.push(category.id);
            }
            select.append(option);
        }
        select.on('change', function() {
            self.selectedCategories(select.val());
            self.loadSpendingDataOverTime();
        });
        select.material_select();

        self.optionsLoading(false);
    };

    self.updateTripSelect = function() {
        var select = $('#trip-select');

        select.material_select('destroy');
        select.empty();
        select.append($('<option>').attr('value', 'label').text('Select Trip').prop('disabled', true));
        
        for(var j = 0; j < self.trips().length; j++) {
            var trip = self.trips()[j];
            var option = $('<option>').attr('value', trip.id).text(trip.trip_name);
            if(trip.is_active) {
                option = option.prop('selected', true);
                self.defaultTrip(trip.id);
            }
            select.append(option);
        }

        select.material_select();
    };

    self.loadCategoriesForTrip = function() {
        if(!self.selectedTrip()) {
            return;
        }
        $.ajax({
            type: 'GET',
            url: '/categoriesForTrip?tripId=' + self.selectedTrip(),
            success: function(data) {
                self.categories(JSON.parse(data));
                self.updateCategorySelect();
                self.loadSpendingData();
            }
        });
    };

    self.setupTabs = function() {
        self.selectedTab.subscribe(function() {
            self.displayCategorySelect(self.selectedTab() == '#over-time');
            self.loadSpendingData();
        });
    };

    self.loadTrips = function() {
        $.ajax({
            type: 'GET',
            url: '/trips',
            success: function(data) {
                // console.log('DONE');
                // console.log(data);
                self.trips(JSON.parse(data));
                self.updateTripSelect();
                self.setupTabs();
                self.loadSpendingData(true);
            }
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
    };

    self.getItem = function(item) {
        if (typeof(Storage) !== "undefined") {
            return localStorage.getItem(item);
        } else {
            console.log('No support for localStorage in browser.');
            return null;
        }
    };

    self.loadTrips();
};