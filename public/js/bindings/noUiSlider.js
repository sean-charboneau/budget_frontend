ko.bindingHandlers.noUiSlider = {
    init: function(element, options) {
        console.log('init');
        console.log(element);
        var self = this;
        self.sliderUpdate = {};
        noUiSlider.create(element, {
            start: [options().value ? options().value() : 1],
            range: {
                min: options().min || 1,
                max: options().max || 100
            },
            step: options().step || 1,
            id: options().id || ''
        });
        element.noUiSlider.on('update', function(values) {
            var value = values[0];
            var id = element.noUiSlider.options.id;
            self.sliderUpdate[id] = true;
            options().value(Math.floor(value));
            self.sliderUpdate[id] = false;
        });
        options().value.subscribe(function(val) {
            var id = element.noUiSlider.options.id;
            if(self.sliderUpdate[id]) {
                return;
            }
            if(val > element.noUiSlider.options.range.max) {
                element.noUiSlider.updateOptions({
                    range: {
                        min: 1,
                        max: parseInt(val)
                    }
                });
            }
            element.noUiSlider.set(val);
        });
    }
};