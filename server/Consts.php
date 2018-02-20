<?php
define('URL', 'http://venus.cotuca.unicamp.br/u16187/helicopter');

class Consts {
    const MAX_SEED = 127873; // 2147483647 / 16807
    
    const Y_ACCELERATION_UP = 0.0008;
    const Y_ACCELERATION_DOWN = -0.001;
    const X_ACCELERATION = 0.0000004;

    const TUBE_COUNT = 3;
    const OPENING_SIZE = 3;
    const TUBE_MARGIN = 0.2;
    const TUBE_WIDTH = 140; // Em px
    
    const START_TUBE_POS = -1;
    
    const HELI_WIDTH = 140;
    const HELI_HEIGHT = 70;
    
    const X_POS = 0.17;
    const Y_POS = 0.5;
    const X_VEL = 0.01;
    
    const IDEAL_DELTA = 16; // Em ms
    const MAX_VALID_DELTA = 45; // Em ms
    
    const TRUNC_AMT = 12;
}
?>