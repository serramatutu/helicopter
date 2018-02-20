'use strict';

function GraphicElement(dayImgPath, nightImgPath) {
    this.dayImg = new Image();
    this.dayImg.src = dayImgPath;
    this.nightImg = new Image();
    this.nightImg.src = nightImgPath;
}

Object.defineProperties(GraphicElement.prototype, {
    width: {
        get: function() {
            return this.nightImg.width > this.dayImg.width ?
                        this.nightImg.width : this.dayImg.width;
        }
    },

    height: {
        get: function() {
            return this.nightImg.height > this.dayImg.height ?
                        this.nightImg.height : this.dayImg.height;
        }
    }
});


var GraphicsManager = {
    _canvas: null,
    _ctx: null,

    _screenMessage: null,
    _fontSize: 0,
    _messageFont: null,
    _scoreFont: '80px "Computer-Pixel-7"',
    _textColor: new DayNightColorPair(RGBColor.black, RGBColor.white),
    TEXT_MARGIN: 30,
    FONT_SIZE: 170,

    _dayPercentage: 1 - (Math.round( ((new Date()).getHours()/24 - 0.25) % 1 )), // Começa na hora atual do dia :)
    _dayNightTimer: null,
    DAYNIGHT_CYCLE_TIME: 40, // em segundos

    COLOR_TRANSITION_FRAME: 0.016,
    COLOR_TRANSITION_DURATION: 3.5, // em segundos

    _heliOff: new GraphicElement('img/HOFF.png', 'img/HOFFN.png'),
    _heliOn: new GraphicElement('img/HON.png', 'img/HONN.png'),
    _tubeTop: new GraphicElement('img/tuboT.png', 'img/tuboTN.png'),
    _tubeBottom: new GraphicElement('img/tuboB.png', 'img/tuboBN.png'),

    init: function() {
        this._canvas = document.createElement('canvas');
        document.body.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');

        // Para mudança de tamanho na janela
        var fn = () => {
            this._canvas.width = document.body.clientWidth;
            this._canvas.height = document.body.clientHeight;

            this._recalcMessageFont();
            Server.reportResize();
        }
        window.addEventListener('resize', fn);
        fn(); // Configura o canvas adequadamente
    },

    paint: function() {
        // Limpa a tela
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // Desenha o fundo
        BackgroundManager.paint(this._ctx, this._canvas.width, this._canvas.height, this._dayPercentage);

        // Desenha o personagem
        // Dia
        if (this._dayPercentage != 0) {
            this._ctx.globalAlpha = 1;
            this._ctx.drawImage(Game.active ? this._heliOn.dayImg : this._heliOff.dayImg,
                                Game._xpos * (this._canvas.width + Server.constants.TUBE_WIDTH) - (Server.constants.HELI_WIDTH + Server.constants.TUBE_WIDTH)/2,
                                Game._ypos * this._canvas.height - Server.constants.HELI_HEIGHT/2);
        }
        // Noite
        if (this._dayPercentage != 1) {
            this._ctx.globalAlpha = 1 - this._dayPercentage;
            this._ctx.drawImage(Game.active ? this._heliOn.nightImg : this._heliOff.nightImg,
                                Game._xpos * (this._canvas.width + Server.constants.TUBE_WIDTH) - (Server.constants.HELI_WIDTH + Server.constants.TUBE_WIDTH)/2,
                                Game._ypos * this._canvas.height - Server.constants.HELI_HEIGHT/2);
        }

        // Desenha tubos
        Game._tubes.forEach((t, i) => {
            // t é a posição da abertura do cano
            var x = (this._canvas.width + Server.constants.TUBE_WIDTH) -
                    (Server.constants.TUBE_COUNT - 1 - i + Game._tubepos) * (this._canvas.width + Server.constants.TUBE_WIDTH)/Server.constants.TUBE_COUNT
                    - Server.constants.TUBE_WIDTH;


            var offset = Math.abs(Math.max(i - 1, 0) * (1 - Game._tubepos)),
                topHeight = this._canvas.height * (t - offset) - Server.constants.OPENING_SIZE * Server.constants.HELI_HEIGHT / 2,
                bottomHeight = this._canvas.height * (t + offset) + Server.constants.OPENING_SIZE * Server.constants.HELI_HEIGHT / 2;
            
            // Dia            
            if (this._dayPercentage != 0) {
                this._ctx.globalAlpha = 1;
                this._ctx.drawImage(this._tubeTop.dayImg,
                                    x,
                                    topHeight - this._tubeTop.dayImg.height,
                                    Server.constants.TUBE_WIDTH,
                                    this._tubeBottom.dayImg.height); // Tubo de cima

                this._ctx.drawImage(this._tubeBottom.dayImg,
                                    x,
                                    bottomHeight,
                                    Server.constants.TUBE_WIDTH,
                                    this._tubeBottom.dayImg.height); // Tubo de baixo
            }

            // Noite
            if (this._dayPercentage != 1) {
                this._ctx.globalAlpha = 1 - this._dayPercentage;
                this._ctx.drawImage(this._tubeTop.nightImg,
                                    x,
                                    topHeight - this._tubeTop.nightImg.height,
                                    Server.constants.TUBE_WIDTH,
                                    this._tubeBottom.nightImg.height); // Tubo de cima

                this._ctx.drawImage(this._tubeBottom.nightImg,
                                    x,
                                    bottomHeight,
                                    Server.constants.TUBE_WIDTH,
                                    this._tubeBottom.nightImg.height); // Tubo de baixo
            }
        });

        this._ctx.globalAlpha = 1;

        this._ctx.fillStyle = this._textColor.transition(this._dayPercentage).toHexString();
        if (Game.running) {
            this._ctx.textAlign = 'left';
            this._ctx.textBaseline = 'top';
            this._ctx.font = this._scoreFont;
            this._ctx.fillText(Game._score, this.TEXT_MARGIN, this.TEXT_MARGIN);
        }

        // Desenha mensagens na tela
        if (!!this._screenMessage) {
            this._ctx.textAlign = 'center';
            this._ctx.textBaseline = 'middle';
            this._ctx.font = this._messageFont;
            this._ctx.fillText(this._screenMessage, this._canvas.width/2, this._canvas.height/2);
        }
    },

    // Limpar isso aqui
    message: function(msg) {
        this._screenMessage = msg;
        this._recalcMessageFont();
    },

    unsetScreenMessage: function() {
        this._screenMessage = null;
    },
        
    _recalcMessageFont: function() {
        if (!this._screenMessage)
            return;

        var w = 0;
        var f = this.FONT_SIZE + 1;
        do {
            this._ctx.font = --f + 'px "Computer-Pixel-7"';
            w = this._ctx.measureText(this._screenMessage).width;
        } while (w > this._canvas.width - this.TEXT_MARGIN*2);

        this._messageFont = this._ctx.font;
    },

    dayNight: function() {
        var day = this._dayPercentage == 1;
        var rate = this.COLOR_TRANSITION_FRAME/this.COLOR_TRANSITION_DURATION;

        var timer = setInterval(() => {
            if (day)
                this._dayPercentage -= rate;
            else
                this._dayPercentage += rate;

            if (this._dayPercentage <= 0 || this._dayPercentage >= 1) { // Limpa o timer
                this._dayPercentage = Math.round(this._dayPercentage);
                clearInterval(timer);
            }

        }, this.COLOR_TRANSITION_FRAME * 1000);

    },

    start: function() {
        this.unsetScreenMessage();
        this._dayNightTimer = setInterval(() => {
            this.dayNight();
        }, this.DAYNIGHT_CYCLE_TIME * 1000);
    },

    stop: function() {
        clearInterval(this._dayNightTimer);
    }
}

Object.defineProperties(GraphicsManager, {
    width: {
        get: function() {
            return this._canvas.width;
        }
    },

    height: {
        get: function() {
            return this._canvas.height;
        }
    }
});
