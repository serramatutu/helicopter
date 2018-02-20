<?php

function truncate($nbr, $amount) {
    $a = pow(10, $amount);
    return floor($nbr * $a) / $a;
}

?>