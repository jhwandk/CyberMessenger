#!/usr/local/bin/php
<?php
ob_start();
# set session
session_name('Login');
session_start();
header('Content-Type: text/plain-text; charset=utf-8');

if (isset($_POST['message']))
{	// if message has been sent with ajax,
	// update the chat log file
	update_log();
}

function update_log()
{
file_put_contents('log.txt', $_POST['message'], FILE_APPEND);
}
?>