/*---------------------------------------------------------------------------------------
    Alert is a simple modal alert dialog system. When triggered, it displays a
    semi-transparent overlay and a dialog containing a title bar, text message,
    and clickable buttons or a non-clickable pacifier message.

    Files:
        alert.js  - include this via <script> tag in your HTML file.
        alert.css - include this via <link> tag in your HTML file.

    Usage:
        "Carefully" edit the styles in alert.css to suit your needs, or use as-is.
        Place a call to Alert.init() in your jQuery $(document).ready() function.
        Create an Alert object: var alerter = new Alert();
        Create and call javascript functions in your code to show alerts. Examples:

            raiseInfoAlert(message) {
                // Example: message = 'You must enter a Name before proceeding.'
                var close = alerter.createAlertAction('alert-close', 'Close', hideAlert);
                alerter.show(message, 'Attention', close);
            };

            raiseWaitAlert(message) {
                // Example: message = 'Your request is being processed.'
                var wait = alerter.createAlertAction();
                alerter.show(message, 'Attention', wait);
            };

            raiseOverwiteAlert(message) {
                // Example: message = 'Ok to overwrite file?'
                var yes = alerter.createAlertAction('alert-yes', 'Yes', overwrite;
                var no = alerter.createAlertAction('alert-no', 'No', hideAlert;
                alerter.show(message, 'Attention', [yes, no]);
            };

        If your alert action handlers do not call Alert's dismiss() function, make
        sure you call it yourself to hide the alert.

    Dependencies:
        jQuery, CSS 3.0
---------------------------------------------------------------------------------------*/

// ----------------------------------------------------------------------------
// Alert class definition:
function Alert() {
    this.defaultTitle = 'ATTENTION';
    this.defaultMessage = 'An unexpected condition has occurred.';
    this.defaultButtonText = 'Close';
    this.defaultWaitText = 'Please wait...';
    this.defaultActionId = 'alert-action';
}

// Creates an alert action to be passed to the show() method.
Alert.prototype.createAlertAction = function(id, text, handler) {
    handler = (handler === undefined || typeof(handler) !== 'function') ? null : handler;
    text = (text === undefined || '' === text) ? (handler ? this.defaultButtonText : this.defaultWaitText) : text;
    id = (id === undefined) ? this.defaultActionId : id;

    var div = handler ? '<div id="'+ id +'" class="alert-button">' : '<div class="alert-wait">';
    //div += text;
    div += Alert.htmlEncode(text);
    div += '</div>';
    var $div = $(div);
    if(handler) $div.click(handler);

    return $div;
}

// Constructs and displays an alert using the given parameters.
Alert.prototype.show = function(message, title, actions) {
    message = (message === undefined || '' === message) ? this.defaultMessage : message;
    title = (title === undefined || '' === title) ? this.defaultTitle : title;
    actions = (actions === undefined) ? this.createAction() : actions;
    actions = (actions instanceof Array) ? actions : [actions];

    $('#alert-title').html(Alert.htmlEncode(title));
    message.replace(/\n/g, '<br />');
    $('#alert-message').html(Alert.htmlEncode(message));

    $('#alert-buttonbar').empty();
    for(var i = 0; i < actions.length; i++) {
        actions[i].appendTo($('#alert-buttonbar'));
    }

    $('#alert-overlay').show();

    $('#alert-buttonbar').focus();
}

// Empties and hides the alert.
Alert.prototype.dismiss = function() {
    $("#alert-overlay").hide();
    $("#alert-title").empty();
    $("#alert-message").empty();
    $("#alert-buttonbar").empty();
}

// Appends the Alert scaffolding to the document body.
Alert.init = function() {
    var div = '\n';
    div += '\n<div id="alert-overlay">';
    div +=     '\n<div id="alert-dialog">';
    div +=        '\n<div id="alert-title"></div>';
    div +=        '\n<div id="alert-message"></div>';
    div +=        '\n<div id="alert-buttonbar" tabindex="1"></div>';
    div +=    '\n</div>';
    div += '\n</div>\n';
    $(div).appendTo('body');
};

Alert.htmlEncode = function(text){
  // Create a in-memory div, set its inner text (which jQuery automatically encodes)
  // Then grab the encoded contents back out. The div never exists on the page.
  return $('<div/>').text(text).html();
}