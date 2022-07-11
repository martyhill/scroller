/*-----------------------------------------------------------------------------
  Include via <script> tag in main HTML file.
  JS Dependencies: jQuery 3.2.0
-----------------------------------------------------------------------------*/

// ----------------------------------------------------------------------------
// Song class definition:
function Song() {
    this.title = null;
    this.lyrics = null;
    this.speed = null;
    this.size = null;
}

Song.prototype.populate = function(text) {
    if(text && text.length > 0) {
        var upper = text.toUpperCase();
        var index;

        this.title = upper.match(/TITLE.*\:.+\n/);
        this.title = this.title ? text.slice(0, this.title[0].length) : null;
        index = this.title ? this.title.lastIndexOf(':') : -1;
        this.title = index !== -1 ? this.title.slice(index+1) : "";
        this.title = this.title.replace(/^\s+/,"").trim();
        if(!this.title) this.title = '...untitled...'

        this.speed = upper.match(/SPEED.*\:.*\d/);
        index = this.speed ? this.speed[0].lastIndexOf(':') : -1;
        this.speed = index !== -1 ? this.speed[0].slice(index+1) : "";
        this.speed = this.speed ? parseInt(this.speed.trim()) : 900;

        this.size = upper.match(/SIZE.*\:.*\d/);
        index = this.size ? this.size[0].lastIndexOf(':') : -1;
        this.size = index !== -1 ? this.size[0].slice(index+1) : "";
        this.size = this.size ? parseInt(this.size.trim()) : 36;

        index = upper.search(/LYRICS(.*):/);
        index += index != -1 ? upper.match(/LYRICS(.*):/)[0].length : 0;
        this.lyrics = index > 0 ? text.slice(++index) : null;
        this.lyrics = this.lyrics ? this.lyrics.split("\n") : [];
        for(var i = 0; i < this.lyrics.length; i++) {
            this.lyrics[i] = this.lyrics[i].replace(/~+$/, '');
        }
    }
    return;
}

Song.prototype.toText = function() {
    var title = this.title ? this.title : "";
    var speed = this.speed ? this.speed : "900";
    var size = this.size ? this.size : "36";
    var lyrics = this.lyrics ? this.lyrics.join("\n") : "";
    
    var text = "";
    text += ("Title: " + title + "\n");
    text += ("Speed: " + speed + "\n");
    text += ("Size: " + size + "\n");
    text += ("Lyrics:\n" + lyrics);
    
    return text;
}

Song.prototype.toHtml = function() {
    if(!this.lyrics) return;
     
    var html = [];
    for(var i = 0; i < this.lyrics.length; i++) {
        var line = this.lyrics[i];
        html[i] = !line ? "<br />" : line;
    }    
     
    html = html.join("\n");
    html = html.replace(/\[/g, '<span class="hi">[');
    html = html.replace(/\]/g, ']</span>');
     
    return html;
}
Song.fromJSON = function(json) {
    var song = new Song();
    song.title = json.title;
    song.speed = json.speed;
    song.size = json.size;
    song.lyrics = json.lyrics;
    return song;
}

// Scroller class definition:
function Scroller() {
    this.songs = null;
    this.songIndex = null;
    this.timer = null;
    this.speed = null;
    this.speedMin = null;
    this.speedMax = null;
    this.speedDefault = null;
    this.sizeMin = null;
    this.sizeMax = null;
    this.sizeDefault = null;
    this.scrollTop = null;
    this.alertMsg = null;
}

Scroller.init = function(song) {
    Scroller.songs = [];
    Scroller.songIndex = null;
    Scroller.timer = null;
    Scroller.speedMin = 1;
    Scroller.speedMax = 999;
    Scroller.speedDefault = 900;
    Scroller.speed = Scroller.speedDefault;
    Scroller.sizeMin = 6;
    Scroller.sizeMax = 148;
    Scroller.sizeDefault = 36;
    Scroller.scrollTop = 0;
    Scroller.alertMsg = new Alert();
}

Scroller.getSongIndex = function(value) {
    if($.isNumeric(value)) {
        value = Math.round(value);
    }
    
    else if(Scroller.songIndex != null) {
        switch(value.toUpperCase()) {
            case "NEXT":
                value = Scroller.songIndex + 1;
                break;
            case "PREV":
                value = Scroller.songIndex - 1;
                break;
            default:
                value = Scroller.songIndex;
        }
    }
    
    else {
        value = 0;
    }

    return value;
}

Scroller.setCurrentSong = function(value) {
    if(typeof value === 'undefined' || Scroller.songIndex === null) {
        $('#title').empty();
        $('#song').empty();
        $('#songNumber').html(0);
        $('#songCount').html(0);
        Scroller.setSize();
        Scroller.setSpeed();
        return;
    }

    value = Scroller.getSongIndex(value);

    if(Scroller.isScrolling()) Scroller.stop();
    
    Scroller.songIndex = Math.min(Math.max(0, value), Scroller.songs.length-1);
    var song = Scroller.songs[Scroller.songIndex];
    
    Scroller.setSize();
    Scroller.setSpeed();
    
    $('#title').empty();
    $('#title').html(song.title);
    
    $('#song').empty();
    $('#song').html(song.toHtml());
    $('#song').scrollTop(0);
    Scroller.scrollTop = 0;
    
    $('#songNumber').html(Scroller.songIndex+1);
    $('#songCount').html(Scroller.songs.length);
    $('#song').focus();
}

Scroller.setPrevSong = function() {
    return Scroller.setCurrentSong("PREV");
}
Scroller.setNextSong = function() {
    return Scroller.setCurrentSong("NEXT");
}

Scroller.getCurrentSong = function() {
    return Scroller.songs[Scroller.songIndex];
}

Scroller.populateTitlesList = function() {
    $('#songTitles').empty();
    
    if(Scroller.songs.length === 0) return;
    
    var p = '<p data-i="{i}" class="songTitle">{t}</p>';
    var s = '<p data-i="{i}" class="songTitle selected">{t}</p>';
    for(var i = 0; i < Scroller.songs.length; i++)
    {
        var t = i === Scroller.songIndex ? s : p;
        var element = t.replace('{i}', i).replace('{t}', Scroller.songs[i].title);
        $(element).appendTo('#songTitles');
    }
}

Scroller.openOverlay = function() {
    Scroller.populateTitlesList();
    $('#overlay').css("display", 'inline-block');
    $('#listGroup').siblings().hide();
    $('#listGroup').show();
}

Scroller.selectSong = function(event) {
    if(Scroller.songs.length === 0) return;
    
    $(this).siblings().removeClass("selected");
    $(this).addClass("selected");
}

Scroller.openAddSongForm = function(event) {
    $('#formGroup').attr("data-mode", "add");
    
    var song = new Song();
    $('#formText').val(song.toText());
    $('#formText').attr('readonly', false);
    $('#formGroup').siblings().hide();
    $('#formGroup').show();
    $('#formText').focus();
}

Scroller.openEditSongForm = function(event) {
    if(Scroller.songs.length === 0) return;

    $('#formGroup').attr("data-mode", "edit");
    
    var selected = $('.songTitle.selected');
    var iSelected = parseInt($(selected).attr('data-i'));
    var song = Scroller.songs[iSelected];
    $('#formText').val(song.toText());
    $('#formText').attr('readonly', false);
    $('#formGroup').siblings().hide();
    $('#formGroup').show();
    $('#formText').focus();
    $('#formText').scrollTop(0);
}

Scroller.openCopySongsForm = function() {
    if(Scroller.songs.length === 0) return;

    $('#formGroup').attr("data-mode", "copy");

    var text = "";
    for(var i = 0; i < Scroller.songs.length; i++) {
        text += Scroller.songs[i].toText();
        text += ("\n\n");
    }
    text = text.slice(0, -2);

    $('#formText').val(text);
    $('#formText').attr('readonly', true);
    $('#formGroup').siblings().hide();
    $('#formGroup').show();
    $('#formText').focus();
    $('#formText').scrollTop(0);
}

Scroller.acceptForm = function(mode) {
    var text = $('#formText').val();
    
    if(!mode || !text || text.length === 0) return;

    if(mode === 'add') {
        var song = new Song();
        song.populate(text);
        Scroller.songs.push(song);
        if(Scroller.songs.length === 1) {
            Scroller.songIndex = 0;
        }
        Scroller.setCurrentSong(Scroller.songIndex);
        Scroller.populateTitlesList();
        Scroller.storeData();
    }
    else if(mode === 'edit') {
        var selected = $('.songTitle.selected');
        var iSelected = parseInt($(selected).attr('data-i'));
        Scroller.songs[iSelected].populate(text);
        if(Scroller.songIndex === iSelected) Scroller.setCurrentSong(iSelected);
        Scroller.populateTitlesList();
        Scroller.storeData();
    }
    else if(mode === 'copy') {
        $('#formText').select();
        document.execCommand('copy');

        var message = "All of your songs have been copied to your clipboard. ";
        message += "Immediately paste them into a separate file if you need to save them.";
        var ok = Scroller.alertMsg.createAlertAction('alert-ok', 'OK', Scroller.hideAlert);
        Scroller.alertMsg.show(message, 'Copy Complete', [ok]);
    }
}

Scroller.closeForm = function(event) {
    Scroller.acceptForm($('#formGroup').attr("data-mode"));
    $('#listGroup').siblings().hide();
    $('#listGroup').show();
    $('#formText').val("");
    $('#formGroup').attr("data-mode", "");
}

Scroller.moveSong = function(event) {
    if(Scroller.songs.length === 0) return;
    
    var selected = $('.songTitle.selected');
    var iSelected = parseInt($(selected).attr('data-i'));
    var sibling = null;

    if($(this).attr("id") === 'moveDown') {
        if(iSelected+1 < Scroller.songs.length) {
            sibling = $(selected).next();
            $(selected).insertAfter(sibling);
        }
    }
    else { // 'moveUp'
        if(iSelected > 0) {
            sibling = $(selected).prev();
            $(selected).insertBefore(sibling);
        }
    }
    
    if(sibling) {
        // Update the order of songs in internal array.
        var iSelected = parseInt($(selected).attr('data-i'));
        var selectedSong = Scroller.songs[iSelected];
        var iSibling = parseInt($(sibling).attr('data-i'));
        var siblingSong = Scroller.songs[iSibling];
        Scroller.songs[iSelected] = siblingSong;
        Scroller.songs[iSibling] = selectedSong;

        // If necessary, update the "x/y" display.
        if(iSelected === Scroller.songIndex)
        {
            Scroller.songIndex = iSibling;
            $('#songNumber').html(Scroller.songIndex + 1);
        }
        else if(iSibling === Scroller.songIndex) {
            Scroller.songIndex = iSelected;
            $('#songNumber').html(Scroller.songIndex + 1);
        }

        // Update the index of the affected elements.
        $(selected).attr('data-i', iSibling.toString());
        $(sibling).attr('data-i', iSelected.toString());
    }
}

Scroller.deleteSong = function() {
    if(Scroller.songs.length === 0) return;
    
    var selected = $('.songTitle.selected');
    var iSelected = parseInt($(selected).attr('data-i'));
    var newSelected = null;
    if(iSelected < Scroller.songs.length-1) {
        newSelected = $(selected).next();
        var reIndex = function(n, o) {
            var i = parseInt($(o).attr('data-i')) - 1;
            $(o).attr('data-i', i.toString());
        }
        $(selected).nextAll().each(reIndex);
    }
    else if(iSelected === Scroller.songs.length-1) {
        newSelected = $(selected).prev();
    }
    if(newSelected) {
        $(newSelected).siblings().removeClass("selected");
        $(newSelected).addClass("selected");
    }
    $(selected).remove();
    Scroller.songs.splice(iSelected, 1);
    
    if(Scroller.songs.length === 0) Scroller.songIndex = null;

    Scroller.setCurrentSong(Scroller.songIndex);

    Scroller.hideAlert();

    Scroller.storeData();
}

Scroller.confirmDelete = function() {
    if(Scroller.songs.length === 0) return;
    
    var message = "Are you sure you want to delete the currently selected song?";
    var yes = Scroller.alertMsg.createAlertAction('alert-yes', 'Yes', Scroller.deleteSong);
    var no = Scroller.alertMsg.createAlertAction('alert-no', 'No', Scroller.hideAlert);
    Scroller.alertMsg.show(message, 'Attention', [yes, no]);
}

Scroller.hideAlert = function() {
    Scroller.alertMsg.dismiss();
};

Scroller.closeOverlay = function() {
    $('#songTitles').empty();
    $('#overlayPanel').children().css("display", 'none');
    $('#overlay').css("display", 'none');
}

Scroller.getSpeed = function(value) {
    return Math.min(Scroller.speedMax, Math.max(Scroller.speedMin, value));
}

Scroller.setSpeed = function(event) {
    if(Scroller.songs.length === 0) {
        $('#speed').html("000");
        return;
    }

    var song = Scroller.getCurrentSong();
    var change = 0;
    var id = event ? $(this).attr('id') : null;
    switch(id) {
        case "maxSlower":
            change = (song.speed > 975 ? -(song.speed-975) : -25);
            break;
        case "minSlower":
            change = -1;
            break;
        case "minFaster":
            change = 1;
            break;
        case "maxFaster":
            change = (song.speed < 25 ? (25-song.speed) : 25);
            break;
        default:
            break;
    }
    song.speed = Scroller.getSpeed(song.speed + change);
    $('#speed').html(Scroller.toPaddedString(song.speed, 3, '0'));
    Scroller.speed = song.speed;
    if(change) Scroller.storeData();
}

Scroller.getSize = function(value, change) {
    value += change ? change : 0;
    return Math.min(Scroller.sizeMax, Math.max(Scroller.sizeMin, value));
}

Scroller.setSize = function(event) {
    if(Scroller.songs.length === 0) {
        $('#size').html("00");
        return;
    }

    var change = 0;
    var id = event ? $(this).attr('id') : null;
    if(id == "bigger") {
        change = 2;
    }
    else if(id == "smaller") {
        change = -2;
    }
    
    var song = Scroller.getCurrentSong();
    song.size = Scroller.getSize(song.size, change);
    $('#size').html(song.size);
    $('#title').css("font-size", song.size+"px");
    $('#song').css("font-size", song.size+"px");
    if(change) Scroller.storeData();
}

Scroller.toPaddedString = function(value, length, chr) {
    value = value ? value.toString() : "";
    if(!chr) chr = ' ';
    while(value.length < length) {
        value = chr + value;
    }
    return value;
}

Scroller.isScrolling = function() {
    return Scroller.timer != null;
}

Scroller.atBottom = function(current) {
    return Scroller.scrollTop > 0 && current == Scroller.scrollTop;
}

Scroller.toggleScrolling = function() {
    if(Scroller.songs.length === 0) return;
    
    if(Scroller.isScrolling()) {
        Scroller.stop();
    }
    else {
        if(Scroller.atBottom($('#song').scrollTop())) {
            Scroller.scrollTop = 0;
            $('#song').scrollTop(0);
        }
        Scroller.start();
    }
}

Scroller.stop = function() {
    clearTimeout(Scroller.timer);
    Scroller.timer = null;
    $('#scrollButton').removeClass("icon_stop_alt2").addClass("arrow_triangle-down_alt2");
}

Scroller.start = function() {
    var current = $('#song').scrollTop();
    
    if(Scroller.atBottom(current)) {
        Scroller.stop();
    }
    else {
        var scrolling = Scroller.isScrolling();
        if(!scrolling) {
            $('#scrollButton').removeClass("arrow_triangle-down_alt2").addClass("icon_stop_alt2");
        }
        Scroller.scrollTop = current;
        $('#song').scrollTop(++current);
        if(scrolling) clearTimeout(Scroller.timer);
        var interval = Scroller.speedMax - Scroller.speed + 1;
        Scroller.timer = setTimeout(Scroller.start, interval);
    }
}

Scroller.pgUp = function() {
    var current = $('#song').scrollTop();
    var incr = $('#song').height() * 0.95
    $('#song').scrollTop(current - incr);
}

Scroller.pgDn = function() {
    var current = $('#song').scrollTop();
    var incr = $('#song').height() * 0.95
    $('#song').scrollTop(current + incr);
}

Scroller.openHelp = function() {
    $('#overlay').css("display", 'inline-block');
    $('#helpGroup').siblings().hide();
    $('#helpGroup').show();
}

Scroller.closeHelpOverlay = function() {
    $('#listGroup').siblings().hide();
    $('#listGroup').show();
    $('#overlay').css("display", 'none');
}

Scroller.handleKeys = function(event) {
    if(event.keyCode !== 13 && event.keyCode !== 27 && event.keyCode !== 32) return;

    if($('#listGroup').css('display') != 'none') {
        if(event.keyCode === 27)
            // Esc
            $('#closeOverlay').click();
    }
    else if($('#formGroup').css('display') != 'none') {
        if(event.keyCode === 27) {
            $('#formText').val("");
            $('#closeForm').click();
        }
        else if(event.keyCode === 13 && $(':focus').attr("id") != 'formText') {
            $('#closeForm').click();
        }
    }
    else if($('#helpGroup').css('display') != 'none') {
        if(event.keyCode === 27)
            $('#closeHelp').click();
    }
    else if(event.keyCode === 32) {
        // Space
        event.preventDefault();
        Scroller.toggleScrolling();
    }
    else if(event.keyCode === 33) {
        // PgUp - default behaviour: go up full page
        event.preventDefault();
        Scroller.pgUp()
    }
    else if(event.keyCode === 34) {
        // PgDn - default behaviour: go down full page
        event.preventDefault();
        Scroller.pgDn()
    }
}

Scroller.html5Supported = function() {
    var ok = true;
    if(!('geolocation' in navigator)) {
        var message = "";
        message += "Scroller cannot function properly because your browser does not support HTML5.\n\n";
        message += "Please consider upgrading to a newer browser that supports HTML5.";
        var ok = Scroller.alertMsg.createAlertAction('alert-ok', 'OK', Scroller.hideAlert);
        Scroller.alertMsg.show(message, 'Attention', [ok]);
        ok = false;
    }
    return ok;
}

Scroller.localStorageSupported = function() {
    var ok = true;
    if(!localStorage) {
        var message = "";
        message += "Scroller cannot function properly because your browser is not configured to allow web storage.\n\n";
        message += "You can enable web storage by changing the appropriate setting in your browser.\n\n";
        message += "For additional info, use your preferred search engine to search for 'enable local storage in <theNameOfYourBrowser>'.";
        var ok = Scroller.alertMsg.createAlertAction('alert-ok', 'OK', Scroller.hideAlert);
        Scroller.alertMsg.show(message, 'Attention', [ok]);
        ok = false;
    }
    return ok;
}

Scroller.storeData = function() {
    if(Scroller.songs.length === 0) return;
    localStorage.setItem("Scroller.songs", JSON.stringify(Scroller.songs));
}

Scroller.loadData = function() {
    var songs  = localStorage.getItem("Scroller.songs");
    if(songs) {
        songs = JSON.parse(songs);
        for(var i = 0; i < songs.length; i++) {
            var song = Song.fromJSON(songs[i]);
            Scroller.songs.push(song);
        }
        if(Scroller.songs.length > 0) Scroller.songIndex = 0;
    }
}

// jQuery "Document Ready" function:
$(function() {
    // Initialize Scroller...
    Alert.init();
    Scroller.init();

    // Check for required browser capabilties...
    // (Yes, I know I could use Modernizr instead.)
    if(!Scroller.html5Supported() || !Scroller.localStorageSupported()) return;

    // Global key handler...
    $(window).keyup(Scroller.handleKeys);

    // Main screen click handlers...
    $(document).on('click', '.songTitle', Scroller.selectSong);
    $('#moveDown').click(Scroller.moveSong);
    $('#moveUp').click(Scroller.moveSong);
    $('#nextSong').click(Scroller.setNextSong);
    $('#prevSong').click(Scroller.setPrevSong);
    $('#pgUp').click(Scroller.pgUp);
    $('#toggleScroll').click(Scroller.toggleScrolling);
    $('#pgDn').click(Scroller.pgDn);
    $('#maxSlower').click(Scroller.setSpeed);
    $('#minSlower').click(Scroller.setSpeed);
    $('#minFaster').click(Scroller.setSpeed);
    $('#maxFaster').click(Scroller.setSpeed);
    $('#bigger').click(Scroller.setSize);
    $('#smaller').click(Scroller.setSize);
    $('#configure').click(Scroller.openOverlay);
    $('#help').click(Scroller.openHelp);

    // Overlay & Group click handlers...
    $('#closeOverlay').click(Scroller.closeOverlay);
    $('#add').click(Scroller.openAddSongForm);
    $('#edit').click(Scroller.openEditSongForm);
    $('#copy').click(Scroller.openCopySongsForm);
    $('#closeForm').click(Scroller.closeForm);
    $('#delete').click(Scroller.confirmDelete);
    $('#closeHelp').click(Scroller.closeOverlay);

    // Songs...
    Scroller.loadData();
    Scroller.setCurrentSong(0);
});
