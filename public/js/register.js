var RegisterViewModel = function() {
    var self = this;

    self.register = function (e) {
        var username = $('#username').val();
        var password = $('#password').val();
        var email = $('#email').val();
        var firstName = $('#firstName').val();
        var lastName = $('#lastName').val();
        $.ajax({
            type: 'POST',
            url: '/register',
            data: {
                username: username,
                password: password,
                email: email,
                firstName: firstName,
                lastName: lastName
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