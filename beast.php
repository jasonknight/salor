<?php
  $action = $_GET['action'];
  switch ($action) {
  
  // Say Hello, used to see if the server is online
  case 'hello':
    header("Content-Type: application/javascript;");
    echo "_beast_lives = true;";
    break;
  default:
    $api_key = $_POST['api_key'];
    if (is_dir('./clients/' . $api_key)) {
    
    } else {
      header("Content-Type: application/javascript;");
      echo "_beast_lives = false;alert('You do not have an account with us.');";
    }
    break;
  // end of case 'hello':
  
  } // end of switch ($action) {
?>