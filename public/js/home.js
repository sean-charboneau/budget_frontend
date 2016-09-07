var signOut = function() {
    deleteCookie('seanBudgetToken');
    window.location = '/';
};

var deleteCookie = function(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};