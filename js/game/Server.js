'use strict';
        
var Server = {
    _seed: null,
    _initialSeed: null,
    
    constants: {},
    _isScoreValid: null,
    
    restart: function(callback) {
        $.ajax({
            url: 'server/resources.php',
            data: 'seed',
            method: 'GET',
            contentType: 'text',
            timeout: 3000
        }).done((data) => {
            this._seed = parseInt(data) % this.constants.MAX_SEED;
            if (this._seed <= 0) 
                this._seed += this.constants.MAX_SEED - 1;
            
            this._initialSeed = this._seed;
        }).fail((xhr) => {
            UIManager.popup('Erro de conexão', 'A resposta do servidor demorou muito.', 'error');
        }).then(() => {
            if (typeof callback === 'function')
                callback();
        });
        
        this.reportTickState.active = false;
        this._isScoreValid = true;
        this._currTick = 0;
        
        this._replay.length = 0;
        this._screen.length = 0;
        this.reportResize(); // Para tamanho inicial da tela
    },
    
    resetPRNG: function() {
        this._seed = this._initialSeed;  
    },
    
    init: function(callback) {        
        $.ajax({
            url: 'server/resources.php',
            data: 'consts',
            method: 'GET',
            contentType: 'text',
            dataType: 'json',
            timeout: 3000
        }).done((data) => {
            for(var constname in data)
                this.constants[constname] = data[constname];
        }).fail((xhr) => {
            UIManager.popup('Erro de conexão', 'A resposta do servidor demorou muito.', 'error');
        }).then(() => {
            if (typeof callback === 'function')
                callback();
        });
    },
    
    _replay: [],
    _currTick: 0,
    reportTickState: function(correctionFactor, active) {
        if (active != this.reportTickState.active) {
            this.reportTickState.active = active;
            this._replay.push(Math.round(this._currTick));
        }
        this._currTick += correctionFactor;
    },
    
    _screen: [],
    reportResize: function() {
        this._screen.push({
            tick: Game.currentTick,
            x: GraphicsManager.width,
            y: GraphicsManager.height
        });
    },
    
    submit: function() {
        $.ajax({ // Submete replay ao servidor para aprovação
            url: 'server/engine.php',
            data: {
                replay: JSON.stringify(this._replay),
                screen: JSON.stringify(this._screen)
            },
            method: 'POST',
            fail: function(data) {
                UIManager.popup('Erro de conexão', 'A resposta do servidor demorou muito.', 'error');
            }
        }).done(function(data) {
            if (data == 'err')
                UIManager.popup('Erro', 'Erro interno de servidor. Tente novamente mais tarde...', 'error');
            else if (data == 'invalid_score' || !Server._isScoreValid)
                UIManager.popup('Envio de score', 'Sua pontuação é inválida. Não foi possível cadastrá-la no servidor', 'error');                
            else {
                var score = parseInt(data);
                if (score != Game.score)
                    UIManager.popup('Aviso', 'A pontuação calculada pelo servidor ('+score+') '+
                                             'é diferente da calculada pelo cliente ('+Game.score+'). '+
                                             'Seu ranking será um pouco diferente...', 'warning');

                if (score > 0)
                    UIManager.showSubmitModal();   
            }
        });
    },
    
    invalidateScore: function() {
        if (this._isScoreValid) {
            $.ajax({ // Avisa o servidor de que o score é inválido
                url: 'server/submitscore.php',
                data: {
                    invalidateScore: true
                },
                method: 'POST'
            });

            UIManager.popup('Lag de sistema', 'Sua pontuação será desconsiderada devido a lag de sistema. :(', 'warning');
        }
        
        this._isScoreValid = false;
    }
}

Object.defineProperties(Server, {
    nextInt: {
        get: function() {
            this._seed = this._seed * 16807 % this.constants.MAX_SEED;
            return this._seed;
        }
    },
    nextFloat: {
        get: function() {
            var a = (this.nextInt - 1) / (this.constants.MAX_SEED - 1);
            return a.toFixed(this.constants.TRUNC_AMT);
        }
    },
    replay: {
        get: function() {
            return this._replay;
        }
    }
});