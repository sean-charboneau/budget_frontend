var IndexViewModel = function() {
    var self = this;

    self.logIn = function (e) {
        var username = $('#username').val();
        var password = $('#password').val();
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
        return false;
    };
};