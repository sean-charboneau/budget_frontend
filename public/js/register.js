var RegisterViewModel = function() {
    var self = this;

    self.registerError = ko.observable();

    self.username = ko.observable();
    self.password = ko.observable();
    self.email = ko.observable();
    self.firstName = ko.observable();
    self.lastName = ko.observable();

    self.register = function () {
        self.registerError('');
        $.ajax({
            type: 'POST',
            url: '/register',
            data: {
                username: self.username(),
                password: self.password(),
                email: self.email(),
                firstName: self.firstName(),
                lastName: self.lastName(),
                baseCurrency: $('.currency-dropdown').val()
            },
            success: function(data) {
                if(!data || data.error) {
                    self.registerError(data.error);
                }
                else {
                    $.ajax({
                        type: 'POST',
                        url: '/login',
                        data: {
                            username: self.username(),
                            password: self.password()
                        },
                        success: function(data) {
                            if(!data || data.error) {
                                self.registerError(data.error);
                            }
                            else {
                                document.cookie = data.cookie.split(';')[0];
                                document.location = '/createTrip?first=1';
                            }
                        }
                    });
                }
            }
        });
        return false;
    };
};