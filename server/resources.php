<?php
session_start();

//require_once("redirect_get.php");

// Retorna as constantes do jogo
if (isset($_GET['consts'])) {
    require_once("Consts.php");
    $r = new ReflectionClass("Consts");
    $constsArr = $r->getConstants();
    echo (json_encode($constsArr));
}

// Retorna a seed para a partida
if (isset($_GET['seed'])) {
    $_SESSION['seed'] = mt_rand();
    unset($_SESSION['score']);
    $_SESSION['isScoreValid'] = true;
    echo $_SESSION['seed'];
}
    
?>