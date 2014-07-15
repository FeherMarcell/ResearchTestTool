<?php

$server = "localhost";
$user = "root";
$pass = "";
$db = "myth";
//$db = "meetyouthere";

mysql_connect($server, $user, $pass);
mysql_select_db($db);
mysql_query("SET NAMES UTF8");