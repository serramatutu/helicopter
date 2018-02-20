'use strict';

var Game = {
    COUNTDOWN_TIME: 3000,

    _yvel: null,
    _xvel: null,

    _ypos: null,
    _xpos: null,
    _tubepos: null, // Posição do primeiro tubo

    _running: false,
    _paused: true,
    _active: false,
    _alive: false,

    _score: 0,

    _tubes: [], // 0->TUBE_COUNT, da esquerda para a direita
    
    _lastDelta: 0,
    
    _tickCount: 0,

    init: function() {
        Server.init(function() {
            this.restart();
            this._run();
        }.bind(this));
        GraphicsManager.init();
        UIManager.popup('Informação', 'Utilize espaço ou botão do mouse para jogar', 'info');
    },

    restart: function() {
        this._running = false;
        this._paused = true;
        this._alive = true;
        InputManager.removeHandlerGroup('togglepaused');
        InputManager.removeHandlerGroup('jump');

        BackgroundManager.restart();
        // Inicia o PRNG do servidor
        Server.restart(function() {
            // Randomiza os tubos
            this._tubes.length = 0;
            for (var i=0; i<Server.constants.TUBE_COUNT; i++) {
                this._randomizeTube();
            } 
            
            GraphicsManager.message('Pressione ENTER para começar');
            InputManager.addKeyHandler('keydown', 'enter', () => {
                this.start();

                InputManager.removeHandlerGroup('startenter');
            }, 'startenter');
        }.bind(this));

        this._tick._scoring = false; // Verificações dentro de tick
        this._tickCount = 0;

        this._score = 0;

        this._yvel = 0;
        this._xvel = Server.constants.X_VEL;
        this._ypos = Server.constants.Y_POS;
        this._xpos = Server.constants.X_POS;
        this._tubepos = Server.constants.START_TUBE_POS;
    },

    start: function() {
        InputManager.addKeyHandler('keydown', 'escape', () => { // Evento do botão de pause
            this.togglePaused();
        }, 'togglepaused');

        InputManager.addKeyHandler('keydown', ' ', () => { // Evento do botão de pause
            this.active = true;
            InputManager.disableGroup('mousejump');
        }, ['keyboardjump', 'jump']);

        InputManager.addKeyHandler('keyup', ' ', () => { // Evento do botão de pause
            this.active = false;
            InputManager.enableGroup('mousejump');
        }, ['keyboardjump', 'jump']);

        InputManager.addMouseHandler('mousedown', () => {
            this.active = true;
            InputManager.disableGroup('keyboardjump');
        }, ['mousejump', 'jump']);

        InputManager.addMouseHandler('mouseup', () => {
            this.active = false;
            InputManager.enableGroup('keyboardjump');
        }, ['mousejump', 'jump']);

        BackgroundManager.restart();
        UIManager.hideFixedButtons();
        this._running = true;
        this._isReplaying = false;
        this.unpause();
    },

    unpause: function() {
        if (this._running) {
            InputManager.disableGroup('togglepaused');
            InputManager.disableGroup('jump');
            var countdown = (time) => {
                if (time > 0) {
                    GraphicsManager.message(time/1000); // Converte para segundos

                    setTimeout(() => {
                        countdown(time-1000);
                    }, 1000);
                }
                else {
                    InputManager.enableGroup('togglepaused');
                    InputManager.enableGroup('jump');
                    GraphicsManager.start();
                    this._paused = false;
                }
            }

            countdown(this.COUNTDOWN_TIME);
        }
    },

    pause: function() {
        if (this._running) {
            this._paused = true;
            InputManager.disableGroup('jump');
            this._active = false;
            GraphicsManager.stop();
            GraphicsManager.message('Pausado');
        }
    },

    togglePaused: function() {
        if (this._paused)
            this.unpause();
        else
            this.pause();
    },

    _die: function() {        
        this._yvel = 0;
        this._alive = false;
        this._active = false;
        
        GraphicsManager.message('Você morreu!');
        InputManager.removeHandlerGroup('togglepaused');
        InputManager.removeHandlerGroup('jump');
        if (!this._isReplaying)
            Server.submit(); // Envia o replay ao servidor para aprovação
        
        var replay = Server.replay;
        setTimeout(() => {
            InputManager.addKeyHandler('keydown', ['enter', ' '], () =>{
                this.restart(); 
                InputManager.removeHandlerGroup('restart');
            }, 'restart');
            InputManager.addKeyHandler('keydown', 'r', () =>{
                this.replay(replay); 
                InputManager.removeHandlerGroup('replay');
            }, 'replay');
        }, 1500);
        
        UIManager.showFixedButtons();
    },

    _tick: function(correctionFactor) {
        // Submete o replay do tick atual
        if (!this._isReplaying)
            Server.reportTickState(correctionFactor, this._active);
        
        if (this._ypos >= 0 && this._ypos <= 1) {
            this._ypos -= this._yvel * correctionFactor;
            this._yvel += (this._active? Server.constants.Y_ACCELERATION_UP : Server.constants.Y_ACCELERATION_DOWN) * correctionFactor;
        }

        // Mexe o personagem caso esteja morto
        if (!this._alive)
            this._xpos = (this._xpos - (this._xvel * correctionFactor + 0.01)/Server.constants.TUBE_COUNT);

        // Calcula posição dos tubos
        var prev = this._tubepos;
        this._tubepos = (this._tubepos + this._xvel * correctionFactor) % 1;
        if (this._tubepos < prev) { // Tubo passou de 1/3 da tela
            this._removeTube();
            this._randomizeTube();
        }
        
        // Velocidade X e fundo
        this._xvel += Server.constants.X_ACCELERATION * correctionFactor;
        BackgroundManager.tick(correctionFactor);

        // Checagem por colisão no teto e no chão
        if ((this._ypos <= 0 || this._ypos >= 1) && this._alive) {
            this._ypos = Math.round(this._ypos); // Deixa o personagem exatamente na borda

            this._die();
            return;
        }

        // Distância x entre o helicóptero e o tubo mais próximo
        var dx = Math.abs(this._xpos - (1 - this._tubepos)/Server.constants.TUBE_COUNT) * (GraphicsManager.width + Server.constants.TUBE_WIDTH);
        if (dx < (Server.constants.TUBE_WIDTH + Server.constants.HELI_WIDTH)/2) { // Se está passando pelo tubo (X)
            // Checagem por colisão no tubo
            if (Math.abs(this._ypos - this._tubes[0]) * GraphicsManager.height +
                Server.constants.HELI_HEIGHT/2 > Server.constants.HELI_HEIGHT*Server.constants.OPENING_SIZE / 2 &&
                this._alive) {
                this._die();
                return;
            }

            if (!this._tick._scoring) { // Se ainda não marcou o ponto (evita calcular mais de uma vez)
                this._tick._scoring = true;
                this._score++;
            }
        }
        else
            this._tick._scoring = false;
        
        this._tickCount++;
    },
    
    _run: function(delta) {
        if (this._running && !this._paused) {
            var correctionFactor = 1;
            
            // Se não esta jogando
            if (this._isReplaying) {
                if (this._replayData[this._replayIndex] == this.currentTick && this._alive) {
                    this.active = !this.active;
                    this._replayIndex++;
                }
            }
            else {
                correctionFactor = (delta - this._lastDelta)/Server.constants.IDEAL_DELTA;
                if (delta - this._lastDelta > Server.constants.MAX_VALID_DELTA && this._alive)
                    Server.invalidateScore();
            }
            
            this._tick(correctionFactor);
        }
        GraphicsManager.paint();
        this._lastDelta = delta;
        window.requestAnimationFrame(Game._run.bind(this));
    },
    
    _replayData: [],
    _replayIndex: 0,
    replay: function(replayData) {
        this._running = false;
        this._paused = true;
        this._alive = true;
        this._tick._scoring = false; // Verificações dentro de tick
        this._tickCount = 0;
        this._score = 0;
        this._yvel = 0;
        this._xvel = Server.constants.X_VEL;
        this._ypos = Server.constants.Y_POS;
        this._xpos = Server.constants.X_POS;
        this._tubepos = Server.constants.START_TUBE_POS;
        
        // Reinicia os tubos
        Server.resetPRNG();
        this._tubes.length = 0;
        for (var i=0; i<Server.constants.TUBE_COUNT; i++) {
            this._randomizeTube();
        }
        
        BackgroundManager.restart();
        this._running = true;
        
        this._isReplaying = true;
        this._replayIndex = 0;
        this._replayData = replayData;
        
        this.unpause();
    },

    _randomizeTube: function() {
        // Utiliza a seed randomica do servidor
        this._tubes.push(Server.nextFloat * (1 - Server.constants.TUBE_MARGIN * 2) + Server.constants.TUBE_MARGIN);
    },

    _removeTube: function() {
        this._tubes.shift();
    }
}

Object.defineProperties(Game, {
    running: {
        get: function() {
            return this._running;
        }
    },

    active: {
        get: function() {
            return this._active;
        },
        set: function(v) {
            this._active = !!v;
        }
    },
    
    currentTick: {
        get: function() {
            return this._tickCount;
        }
    },
    
    score: {
        get: function() {
            return this._score;
        }
    }
});

(() => {
    function loadfn(e) {
        Game.init();
        window.removeEventListener('load', loadfn) // Remove o evento onload da janela
    }

    window.addEventListener('load', loadfn);
})();
