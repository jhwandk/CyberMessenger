<?php
ob_start();
# set session
session_name('Login');
session_start();

/**
This function confirms new account by checking email and token
from url and comparing to those of the sql database

@return the resulting message
*/
function check_confirmation()
{
	# store values into email and token from url
	$email = $_GET['email'];
	$token = $_GET['token'];
	if ($email === NULL || $token === NULL)
	{ # if nothing is fetched from the link, end function
		return ;
	}
	
	# create/open db file with error exception
	try
	{
		$mydb = new SQLite3('users.db');
	}
	catch (Exception $ex)
	{
		echo $ex->getMessage();
	}
	
	# create table of email, password, token, if not exists
	$statement = 'CREATE TABLE IF NOT EXISTS users (email TEXT, password TEXT, token TEXT);';
	$run = $mydb->query($statement);
	# select the entered email
	$statement = "SELECT email, token FROM users WHERE email=='$email';";
	$run = $mydb->query($statement);
	# fetch fields as array
	$row = $run->fetchArray();
	if ($row['token']==='')
	{	# if there is no confirmation token in the database, do nothing
		$mydb->close();
		return 'This email has already been confirmed.';
	}
	else if ($row['token']===$token)
	{	# if the database's token matches that of the url,
		# remove token in the database
		$statement = "UPDATE users SET token='' WHERE email=='$email';";
		$run = $mydb->query($statement);
		$mydb->close();
		return 'Thank you. Your email has been confirmed.';
	}
	$mydb->close();
	return 'The link does not match!';
}

/**
This function checks the sqlite database
to see if email already exists,
then registers user into database

@return the resulting message
*/
function check_registration()
{
	# store entered email and hashed password
	$email=$_POST['email'];
	$password=(hash('md5',$_POST['password']));
	
	# create/open db file with error exception
	try
	{
		$mydb = new SQLite3('users.db');
	}
	catch (Exception $ex)
	{
		echo $ex->getMessage();
	}
	
	# create table of email, password, token
	$statement = 'CREATE TABLE IF NOT EXISTS users (email TEXT, password TEXT, token TEXT);';
	$run = $mydb->query($statement);
	# select the record with entered email
	$statement = "SELECT email, token FROM users WHERE email=='$email';";
	$run = $mydb->query($statement);
	# fetch fields as array
	$row=$run->fetchArray();
	if (!$row['email'])
	{	# if the email is not found
		# make a hashed random number as confirmation token, insert into database
		$token = hash('md5', rand(0,20000));
		$statement = "INSERT INTO users (email, password, token) VALUES ('$email', '$password', '$token');";
		$run = $mydb->query($statement);
		# send confirmation email with the token
		send_confirmation($email, $token);
		$mydb->close();
		return "A confirmation email has been sent to $email";	
	}
	else if ($row['token'])
	{	# if the confirmation token exists
		$mydb->close();
		return 'Please confirm your email';
	}
	else
	{	# if email is found and confirmation token does not exist
		$mydb->close();
		return 'This email already exists! Please log in.';
	}
}

/**
This function sends a confirmation email to new user

@param string $email the email to confirm
@param string $token the confirmation token

@return void
*/
function send_confirmation($email, $token)
{	
	# set php page, subject, body
	$subject = 'email confirmation';
	$body = 'Confirm your email by clicking here: ';
	# concatenate current directory, php page, and query values
	$body .= "http://{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}?email=$email&token=$token";
	# send it
	mail($email, $subject, $body);
}


/**
This function checks entered email and password
and logs the user in if correct 

return the resulting message
*/
function check_login()
{
	# store entered email and hashed password
	$email=$_POST['email'];
	$password=hash('md5', $_POST['password']);
	
	# create/open db file with error exception
	try
	{
		$mydb = new SQLite3('users.db');
	}
	catch (Exception $ex)
	{
		echo $ex->getMessage();
	}
	
	# create table with email, password, token
	$statement = 'CREATE TABLE IF NOT EXISTS users (email TEXT, password TEXT, token TEXT);';
	$run = $mydb->query($statement);
	# select the record with entered email
	$statement = "SELECT email, password, token FROM users WHERE email=='$email';";
	$run = $mydb->query($statement);
	# fetch fields as array
	$row = $run->fetchArray();
	if (!$row['email'])
	{ // if the email is not found
		$mydb->close();
		return 'No such email found';
	}
	else if ($row['token']!=='')
	{ // if the user has confirmation token
		$mydb->close();
		return 'Please confirm your email';
	}
	else if ($row['password']===$password)
	{ // if password is correct, log the user in with the email
		$mydb->close();
		login($email);
	}
	$mydb->close();
	return 'Wrong password';
}

/**
This function logs in the user with the email address
and redirects user to a new page

@param string $email the email to perform log-in

return void
*/
function login($email)
{
	# get the entered email
	$_SESSION['email'] = $email;
	# redirect to the main page
	header('Location: main.php');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8"/>
	<link rel="stylesheet" type="text/css" href="interface.css">
	<script src="interface.js" defer></script>
	<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
	<title>WebChat</title>
</head>
<body>
	<header>
		<h1 id="title">WebChat</h1>
	</header>
	<main>
		<section id="login_menu" class="window">
			<div id="login_menu_header" class="window_header">Login</div>
			<form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>">
				<label for="email">Email Adress</label>
				<br>
				<input type="email" id="email" name="email" pattern=".+@.+" required /> <!-- change pattern -->
				<br><br>
				<label for="password">Password(&ge; 6 letters/digits)</label>
				<br>
				<input type="password" id="password" name="password" pattern="[a-zA-Z0-9]{6,}" required />
				<br><br>
				<button class="button" name="login"><span>Login</span></button>
				<br><br>
				<button class="button" name="register"><span>Register</span></button>
				<br><br>
			</form>
			<div id="login_message">
				<?php
				# first check whether the url contains confirmation tokens
				echo check_confirmation();
				if (isset($_SESSION['email']))
				{	# if already logged but somehow on this page
					# simply redirect user to the main page
					header('Location: main.php');
				}
				if (isset($_POST['login']))
				{	# if login has been posted, check login
					echo check_login();
				}
				if (isset($_POST['register']))
				{	# if register has been posted, check login
					echo check_registration();
				}
				?>
			</div>
		</section>
	</main>
	
	<footer id="copyright">
		<a href="https://plus.google.com/u/0/101255280562773817062" target="_blank" rel="noopener"><small>&copy;Jinhwan Kim. All Rights Reserved.</small></a>
	</footer>
</body>
</html>
