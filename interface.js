window.onload = function()
{
	// check for the current page and change settings accordingly
	page_setup();
}

/**
This function checks for the current page the user is in
and enables some jquery effects and/or calls some functions

@return void
*/
function page_setup()
{
	/* settings for all pages */
	$(":input").attr('autocomplete', 'off'); // autocomplete
	$("html").attr('oncontextmenu','return false'); // right click context menu
	$("img").attr('draggable','false'); // dragging image
	set_background(); // display background
	
	// split current url by '/', remove last element - page.php
	// also remove GET query: split that by '?' and get first element - page.php 
	const PAGE = window.location.href.split("/").pop().split("?").shift(); 
	
	// individual page settings
	if (PAGE === 'index.php')
	{ // if current page is the login page
		// call login menu slide down animation
		$('#login_menu').css('display', 'none');
		$('#login_menu').slideDown(600, 'swing');
	}
	else if (PAGE === 'main.php')
	{ // if current page is the main page
		// enable window dragging
		$(".window").each(dragElement);
		// trigger updating chat messages
		update_chat();
		// update volume once
		update_volume();
		// enable certain menu icons
		enable_icon('#chat_icon');
		enable_icon('#music_icon');
		enable_icon('#profile_icon');
		enable_icon('#logout_icon');
	}
}

/**
This function finds the name of the page,
displays jpeg background image of the same name

@return void
*/
function set_background()
{
	/* split current url by slash, remove last element - page.php
	then remove extension and add new extension - page.jpg
	format it for css */
	const PATH = "url('bg/" + (window.location.href.split("/").pop().split(".").shift() + ".jpg") + "')";
	
	// set background image with the path
	$('body').css
	({
		// set background image
		'background': PATH,
		// set background to be same size when zoomed
		'background-attachment': 'fixed',
		'background-size': 'cover',
		'background-position': 'center',
		'height' : '100%',
	});
}

// The following deals with sound effects

/**
This function plays sound effect for buttons and clicks

@ return void
*/
function playSound()
{
	let audio = new Audio('sound/button.wav');
	audio.play();
}

$(":input[type='text'], :input[type='email'], :input[type='password']").focus
(
	function()
	{
		playSound();
	}
)

/*
The following deals with the background music
*/

// update the volume of the audio element on change
$('#volume').change
(
	function()
	{
		update_volume();
	}
)

/**
This function changes updates the volume
of the element of the id 'audio'

@return void
*/
function update_volume()
{
	let VOL = ($("#volume").val())/100;
	$('#audio').prop("volume", VOL);
}


// if user has mousedowned on #album_art
$('#album_art').mousedown
(
	function(event) // event listener for mousedown
	{
		switch (event.which)
		{
			case 1: //on left click
				if($('#audio').prop('paused'))
				{	// if the audio is paused
					// change display brightness, play music
					$('#audio').trigger("play");
					$(this).css('filter', 'brightness(100%)');
				}
				else
				{	// if audio is playing
					// change display brightness, pause music
					$('#audio').trigger("pause");
					$(this).css('filter', 'brightness(40%)');
				}
				break;
			case 2: //on middle click
				break;
			case 3: //on right click
				next_song();
				break;
			default: // unknown case
				console.log('Unknown click detected');
		}
	}
)

$('#audio').on('ended', function()
{	// if music has ended, play next song
   next_song();
});

/**
This function checks current audio source,
points to its next source on the playlist and plays it
with a new jpeg album art of the same name as the source
being displayed

@ return void
*/
function next_song()
{	
	const AUDIO = document.getElementById("audio");
	const FOLDER = "sound/";
	let playlist = ['main.mp3', 'dawn.mp3', 'reminiscence.mp3'];
	for (let song in playlist)
	{	// loop through the playlist, creating a playlist with folder name attached
		playlist[song] = FOLDER + playlist[song];
		// playlist = ['folder/xyz.mp3', 'folder/xyz.mp3', ...];
	}
	
	// get the directory of song that's currently being played
	// local directory - foler/xyz.mp3, not http:asdf.asdf/foler.mp3
	let source = FOLDER + document.getElementById("audio_source").src.split('/').pop();
	let track_number = playlist.indexOf(source); // get current track number
	track_number++; // point to the next track
	if (track_number >= playlist.length)
	{ // if the pointed track number exceeds the max track number
		// point back to first song
		track_number = 0;
	}
	
	// change the music src attribute
	document.getElementById("audio_source").src = playlist[track_number]; // set new music
	AUDIO.load(); // load it
	AUDIO.play(); // play it
	
	// change the album art image
	let album_art = "url('" + playlist[track_number].split('.').shift() + ".jpg') round";
	$("#album_art").css('filter', 'brightness(100%)');
	$("#album_art").css('background', album_art);
}

/**
This function enables an icon functionality,
where it will make the button clickable with an inverting effect,
and activate a corresponding menu with the same name as the icon

@param string id the id of the icon to activate, along with its menu

@return void
*/
function enable_icon(id)
{
	// get the id of icon, and its corresponding menu
	const ICON_ID = id;
	const MENU_ID = id.substr(0, id.indexOf("_")+1) + 'menu';
	$(ICON_ID).click
	(	// when icon is clicked,
		function()
		{
			playSound();			
			if (ICON_ID === '#logout_icon')
			{	// if the icon is logout, redirect to logout page, aborting function
				location.href = 'logout.php';
			}
			
			let display = $(MENU_ID).css('display');
			if (display === 'block')
			{	// if the window is currently displayed
				$(ICON_ID).css('filter', 'invert(100%)');
				$(MENU_ID).slideUp(200, 'swing'); // works when there's no min-width/height; it also toggles display property
			}
			else
			{	// if the window is not currently displayed
				// invert icon color
				$(ICON_ID).css('filter', 'invert(0%)');
				// set z-index, show animation, sort windows
				$(MENU_ID).css('z-index', '200');
				$(MENU_ID).slideDown(200, 'swing');
				sort_windows();
			}
		}
	)
}

// when mousedown on a window,
$(".window").mousedown
(
	function()
	{ // define max z-index
		const MAX_Z_INDEX = '200';
		if ($(this).css('z-index') !== MAX_Z_INDEX)
		{	// if a window clicked doesn't have highest z-index.
			// set the window's z-index to highest, and resort the rest of the windows
			$(this).css('z-index', MAX_Z_INDEX);
			sort_windows();
		}
	}
)


/**
This function is called either when a new window is clicked or opened
It assigns appropriate z-index to each window
changes the style of the window of highest z-index

@return void
*/
function sort_windows()
{
	const MAX_Z_INDEX = 200; // The highest z index of the windows
	const MIN_Z_INDEX = 100; // The lowest z index of the windows
	const WINDOWS = document.getElementsByClassName("window"); // all elements with window class
	let z_index_array = []; // the array containing z-index of all windows
	let z_index_increment = 0; // The z index increment to represent "priority points"
	for (let i = 0; i < WINDOWS.length; i++)
	{	// loop through all existing windows
		// create a z-index array from all windows
		z_index_array.push(WINDOWS.item(i).style.zIndex);
	}
	// sort the array - least to greatest
	z_index_array.sort( function(x, y) {return x-y} );
	
	// loop through all exisiting numbers of z-index values arranged in increasing order
	for (let z of z_index_array)
	{
		// examine all existing windows
		for (let w = 0; w < WINDOWS.length; w++)
		{
			if (parseInt(WINDOWS.item(w).style.zIndex) === MAX_Z_INDEX )
			{	// if the window we're examining has the highest z-index already,
				// make the border color of other windows gray,
				$(".window").css('borderColor', '#C0C0C0');
				// make this one's white
				WINDOWS.item(w).style.borderColor = 'white';
			}
			if (WINDOWS.item(w).style.zIndex === z)
			{	// if this window has the corresponding z-index score
				// reassign z-index for the window with corresponding additional z-index value
				WINDOWS.item(w).style.zIndex = MIN_Z_INDEX + z_index_increment;
			}
		}
		/* give extra z-index values for each run (z-index going least to greatest)
		so, window of greatest z-index (besides the max) would be given the most increment
		and the window of least z-index would be given the least increment */
		z_index_increment++;
	}
}
/* explanation:
when mousedown a window, make it 200 (super high priority..) (there are total 200 windows possible)
assign more points to remaining windows in the order of greater z-index:
199 points to the one with second biggest z-index, 198 points to the third, so on
example: a is activated by default
a=200 b=199 c=199 d=199 // visual: a>b=c=d
mousedown on d:
a=199 b=198 c=198 d=200 // visual: d>a>b=c
mousedown on c:
a=198 b=197 c=200 d=199 // visual: c>d>a>b */

/**
This function is NOT MY OWN WORK
source: https://www.w3schools.com/howto/howto_js_draggable.asp
a teeny-tiny jquery addition - Jinhwan KIm
This function makes an element draggable with its header

@param number n the index of the element with class
@param string elmnt the id of the element

@return void
*/
function dragElement(n, elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  // elmnt.onmousedown = dragMouseDown;
  headerId = (elmnt.id + "_header");
  document.getElementById(headerId).onmousedown = dragMouseDown;

	// start dragging
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

	// while dragging
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
	elmnt.style.position = "absolute";
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

	// reset values when finished dragging
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/*
The following below deals with chat system
*/

/**
This function filters a message while
omitting spaces and special characters

@param string message the string data to filter

return filtered version of the message
*/
function filter_message(message)
{
	// an array dictionary of profanity - please excuse my language
	const FILTER_WORDS = ["stupid", 'idiot', 'shit', 'crap', 'asshole', 'damn'];
	// lowercase alphanumeric version of the message, no space, search case-insensitive
	const ALPHANUMERIC = (message.replace(/[^0-9a-z]/gi, '')).toLowerCase();
	for (let word of FILTER_WORDS)
	{ // loop through the entire filter dictionary
		if (ALPHANUMERIC.includes(word))
		{ // if alphanumeric version of the argument includes a profanity,
			// filter the message
			message = 'This message contains profanity.';
		}
	}
	// return the message
	return message;
}

/**
This function gets the email of the user from where
it is displayed with php variable inside an html element

@return the user's email
*/
function get_email()
{
	return document.getElementById("email_display").innerHTML;
}

/**
This function gets the name/id of the user by referencing
the former part of the email before the '@'

@return the user's name
*/
function get_name()
{
	return get_email().substr(0, get_email().indexOf("@"));
}

/**
This function gets the current time as
12-hour:minute format, along with period AM/PM

@return current time
*/
function get_time()
{
	let time = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
	return time;
}

/**
This function gets user input from the chat menu
when the user submits the message, and sends the
message to the php file be processed there

@return void
*/
function submit_message()
{
	// get plain message string
	const INPUT = document.getElementById("message");
	if (INPUT.value === '')
	{	// if an empty string was submitted
		return; // end function
	}
	// filter the plain message string
	let message = filter_message(INPUT.value);
	// empty the input box
	INPUT.value='';
	
	// get user name and current time
	const NAME = "<span class='name'>" + get_name() + "</span>";
	const TIME = "<span class='time'>" + get_time() + "</span>";
	
	// get font settings
	const FONT_SIZE = document.getElementById("font_size").value;
	const FONT_COLOR = document.getElementById("font_color").value;
	const FONT_BOLD = document.getElementById("font_bold").checked
	const FONT_ITALIC = document.getElementById("font_italic").checked
	// bold and italic check
	if (FONT_BOLD)
	{	// if bold check box was checked, add bold tag
		message = '<b>' + message + '</b>';
	}
	if (FONT_ITALIC)
	{	// if italic check box was checked, add italic tag
		message = '<i>' + message + '</i>';
	}
	
	// format the full message
	message = "<span class='message' style='color:" + FONT_COLOR +"; font-size:" + FONT_SIZE + "px;'>" + message + "</span>";
	message = NAME + TIME + "<br>" + message + "<hr>\n";
	
	// send to php to be appended into the log file
	post_to_php('chat.php', 'message', message);
}

/**
This function passes data to a php file with post method

@param string file_name name of php file to send data into
@param string variable_name name of the POST variable
@param string data the value or data to assign to the variable

@return void
*/
function post_to_php(file_name, variable_name, data)
{
	let xhttp = new XMLHttpRequest(); // object to do ajax with
	xhttp.onreadystatechange = function()
	{
		if (this.readyState === 4 && this.status === 200)
		{	// when the operation is complete and successful
			// leave a success message for debug
			console.log("data has been posted succesfully");
		}
	};
	// send the data
	xhttp.open("POST", file_name, true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send(variable_name + '=' + data); // send full message into php
}	

/**
This function updates the chat display
by reading from the log file that stores
users' submission of chat messages

@return void
*/
function update_chat()
{
	// get the element that displays chat messages
	const DISPLAY = document.getElementById("chat_display");
	const WAIT = 10; // milliseconds to wait between each update
	const LOG_FILE = "log.txt"; // file to read
	let xhttp = new XMLHttpRequest(); // object to do ajax with
	xhttp.onreadystatechange = function()
	{
		if (this.readyState === 4 && this.status === 200)
		{	// when the operation is complete and successful
			DISPLAY.innerHTML = this.responseText; // replace display with the content in file
			DISPLAY.scrollTop = DISPLAY.scrollHeight; // scroll display to the bottom
			setTimeout(update_chat, WAIT); // call back update every 10 ms
		}
	};
	xhttp.open("POST", LOG_FILE, true);
	xhttp.send(); // do it!
}