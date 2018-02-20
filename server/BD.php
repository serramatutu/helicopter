<?php

function connect() {
    return new PDO("sqlsrv: Server=regulus.cotuca.unicamp.br; Database=bd16187; ConnectionPooling=0", 
                   "bd16187", 
                   "abcde");
}

?>