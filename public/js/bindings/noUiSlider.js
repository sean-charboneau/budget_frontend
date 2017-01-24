ko.bindingHandlers.noUiSlider = {
    init: function(element, options) {
        console.log(options());
        noUiSlider.create(element, {
            start: [options().value ? options().value() : 1],
            range: {
                'min': options().min || 1,
                'max': options().max || 100
            },
            step: 1
        });
        element.noUiSlider.on('update', function(values) {
            var value = values[0];
            options().value(Math.floor(value));
        });
    }
};