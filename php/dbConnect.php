<?php
/*
$server = "eu-cdbr-azure-west-a.cloudapp.net";
$user = "b272bd984b197b";
$pass = "457632ad";
$db = "cdb_f9bc842d5c";
 */
//$db = "meetyouthere";

$server = "localhost";
$user = "root";
$pass = "";
$db = "myth";

$DB_LINK = mysqli_connect($server, $user, $pass);
mysqli_select_db($DB_LINK, $db);
mysqli_query($DB_LINK, "SET NAMES UTF8");