<?php

error_reporting(E_STRICT);

session_start();

require_once("Consts.php");
require_once("utils.php");

class PRNG {
    private $seed;
    function __construct($seed) {
        $this->seed = $seed % Consts::MAX_SEED;
        if ($this->seed <= 0)
            $this->seed += Consts::MAX_SEED - 1;
    }
    
    public function nextFloat() {
        return truncate(($this->nextInt() - 1) / (Consts::MAX_SEED - 1), Consts::TRUNC_AMT);
    }
    
    public function nextInt() {
        $this->seed = $this->seed * 16807 % Consts::MAX_SEED;
        return $this->seed;
    }
}

class Simulator {
    private $prng;
    
    private $replay;
    private $currReplayIndex = 0;
    
    private $screenResizes;
    private $currResizesIndex = 0;
    
    private $screenWidth;
    private $screenHeight;
    
    private $tick = 0;
    private $active = false;
    private $ypos = Consts::Y_POS;
    private $yvel = 0;
    private $xvel = Consts::X_VEL;
    private $tubepos = Consts::START_TUBE_POS;
    
    private $scoring = false;
    private $score = 0;
    
    private $tubes = array();
    
    function __construct($replay, $screenResizes, $prngSeed) {
        if (gettype($replay) != "array")
            throw new Exception("Replay inválido.");
        if (gettype($screenResizes) != "array")
            throw new Exception("Replay de tela inválido.");
        $this->replay = $replay;
        $this->screenResizes = $screenResizes;
        
        $this->prng = new PRNG($prngSeed);
    }
    
    // Computa o score do jogador baseado no replay
    public function compute() {
        for ($i=0; $i < Consts::TUBE_COUNT; $i++) // Inicializa os tubos
            $this->randomizeTube();
        
//        while (true) {
        for ($i=0; $i<2000; $i++) {        
            // Se o usuário mudou o tamanho da tela
            if ($this->currResizesIndex < count($this->screenResizes) && $this->tick == $this->screenResizes[$this->currResizesIndex]->tick) {
                $this->screenWidth = $this->screenResizes[$this->currResizesIndex]->x;
                $this->screenHeight = $this->screenResizes[$this->currResizesIndex]->y;
                
                $this->currResizesIndex++;
            }
            
            // Próxima ação
            if ($this->currReplayIndex < count($this->replay) && $this->tick == $this->replay[$this->currReplayIndex]) {
                $this->active = !$this->active;
                $this->currReplayIndex++;
            }

            if ($this->ypos >= 0 && $this->ypos <= 1) {
                $this->ypos -= $this->yvel;
                $this->yvel += ($this->active ? Consts::Y_ACCELERATION_UP : Consts::Y_ACCELERATION_DOWN); 
            }

            // Calcula posição dos tubos
            $previous = $this->tubepos;
            $this->tubepos = fmod($this->tubepos + $this->xvel, 1); // % em php nao funfa
            if ($this->tubepos < $previous) { // Tubo passou de 1/3 da tela
                $this->removeTube();
                $this->randomizeTube();
            }
            // Velocidade X
            $this->xvel += Consts::X_ACCELERATION;

            // Checagem por colisão no teto e no chão
            if ($this->ypos <= 0 || $this->ypos >= 1)
                break;

            // Distância x entre o helicóptero e o tubo mais próximo
            $dx = abs(Consts::X_POS - (1 - $this->tubepos)/Consts::TUBE_COUNT) * ($this->screenWidth + Consts::TUBE_WIDTH);
            if ($dx < (Consts::TUBE_WIDTH + Consts::HELI_WIDTH)/2) { // Se está passando pelo tubo (X)
                // Checagem por colisão no tubo
                if (abs($this->ypos - $this->tubes[0]) * $this->screenHeight +
                    Consts::HELI_HEIGHT/2 > Consts::HELI_HEIGHT*Consts::OPENING_SIZE / 2) {
                    break;
                }
                        

                if (!$this->scoring) { // Se ainda não marcou o ponto (evita calcular mais de uma vez)
                    $this->scoring = true;
                    $this->score++;
                }
            }
            else
                $this->scoring = false;

            $this->tick++;
        }
        
        return $this->score;
    }
    
    private function randomizeTube() {
        array_push($this->tubes, $this->prng->nextFloat() * (1 - Consts::TUBE_MARGIN * 2) + Consts::TUBE_MARGIN);
    }
    
    private function removeTube() {
        array_shift($this->tubes);
    }
    
    public function getScore() {
        return $this->score;
    }
}

// Computa o replay de uma partida
if (isset($_POST['replay'])) {
    if ($_SESSION['isScoreValid']) {
        $replay = json_decode($_POST['replay']);
        $screen = json_decode($_POST['screen']);

        try {
            $sim = new Simulator($replay, $screen, $_SESSION['seed']);
            $_SESSION['score'] = $sim->compute();
            $_SESSION['scoretime'] = time(true);

            echo $_SESSION['score'];
        }
        catch(Exception $e) {
            echo 'err';
        }   
    }
    else
        echo 'invalid_score';
}

?>