(function ($, Drupal, once) {
  'use strict';

  Drupal.behaviors.smsCharCounter = {
    attach: function (context, settings) {
      var fields = once('sms-char-counter', '.sms-message-field', context);
      fields.forEach(function(field) {
        var $field = $(field);
        var counterId = $field.data('counter-id');

        $field.on('input', function() {
          var length = $(this).val().length;
          var $counter = $('#' + counterId);

          $counter.text(length);

          // Update counter styling based on length.
          $counter.removeClass('ok warning error');
          if (length > 320) {
            $counter.addClass('error');
          } else if (length > 160) {
            $counter.addClass('warning');
          } else {
            $counter.addClass('ok');
          }
        }).trigger('input');
      });
    }
  };

})(jQuery, Drupal, once);
