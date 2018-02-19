var ProfileViewModel = function() {
	var self = this;
	self.firstName = ko.observable();
	self.lastName = ko.observable();
	self.email = ko.observable();
	self.username = ko.observable();

	self.updateError = ko.observable();

	self.loadUser = function() {
		self.username(vm.user().username);
		self.firstName(vm.user().first_name);
		self.lastName(vm.user().last_name);
		self.email(vm.user().email);
	};

	self.updateUser = function() {
		$.ajax({
			type: 'POST',
			url: '/profile',
			data: {
				firstName: self.firstName(),
				lastName: self.lastName(),
				email: self.email()
			},
			success: function(data) {
				data = JSON.parse(data);
				if(data.error) {
					self.updateError('Error: ' + data.error);
					return;
				}

				swal('Success', 'User information updated succcessfully!', 'success');
			}
		});
	};
};