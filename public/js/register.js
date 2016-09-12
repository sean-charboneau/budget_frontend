var RegisterViewModel = function() {
    var self = this;

    self.selectedCurrency = ko.observable();
    self.username = ko.observable();
    self.password = ko.observable();
    self.email = ko.observable();
    self.firstName = ko.observable();
    self.lastName = ko.observable();

    self.register = function () {
        console.log(self.selectedCurrency());
        $.ajax({
            type: 'POST',
            url: '/register',
            data: {
                username: self.username(),
                password: self.password(),
                email: self.email(),
                firstName: self.firstName(),
                lastName: self.lastName(),
                baseCurrency: self.selectedCurrency().code
            },
            success: function(data) {
                if(!data || data.error) {
                    $('#error-message').text(data.error);
                }
                else {
                    $.ajax({
                        type: 'POST',
                        url: '/login',
                        data: {
                            username: username,
                            password: password
                        },
                        success: function(data) {
                            if(!data || data.error) {
                                $('#error-message').text(data.error);
                            }
                            else {
                                document.cookie = data.cookie.split(';')[0];
                                document.location = '/home';
                            }
                        }
                    });
                }
            }
        });
        return false;
    };
};