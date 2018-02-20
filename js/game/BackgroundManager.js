'use strict';

function Behavior(func, attrs, callback) {
    if (typeof func !== 'function')
        throw new Error('Invalid behavior function');

    if (typeof attrs !== 'object')
        attrs = {};

    this.func = func;
    this.attrs = attrs;

    if (typeof callback === 'function')
        callback.call(this);
}

Behavior.prototype.call = function(dis, correctionFactor) {
    var attrs = this.func.call(dis, correctionFactor, this.attrs);

    if (attrs) // Retorno pode ser usado na proxima chamada
        this.attrs = attrs;
}

function BackgroundElement(dayImgPath, nightImgPath, x, y, z, behavior, groups, spawnChance) {
    GraphicElement.call(this, dayImgPath, nightImgPath)

    this._x = x;
    this._y = y;
    this._z = z;

    if (!(behavior instanceof Behavior))
        throw new Error('Invalid behavior');
    this._behavior = behavior;

    this._groups = Array.isArray(groups) ? groups : [groups];
    this._spawnChance = spawnChance;
}

// Herda de GraphicElement
BackgroundElement.prototype = Object.create(GraphicElement.prototype);
BackgroundElement.prototype.constructor = BackgroundElement;

// Behaviors
BackgroundElement.behaviors = {
    building: new Behavior(function(correctionFactor) {
        this._x -= 0.004 * correctionFactor;
    }),
}

Object.defineProperties(BackgroundElement.behaviors, {
    cloud: {
        get: function () {
            return new Behavior(function(correctionFactor, params) {
                this._x += params.vel * correctionFactor;
            }, {vel: Math.random() * 0.0008 + 0.0001});
        }
    },
    bird: {
        get: function() {
            return new Behavior(function(correctionFactor, params) {
                params.y = params.y || this._y;
                this._x -= 0.003 * correctionFactor;
                this._y = Math.sin((this._x + params.randFac) * 2*Math.PI) * 0.05 + params.y;
            },
            {randFac: Math.random() * 2*Math.PI});
        }
    },
    blob: {
        get: function() {
            return new Behavior(function(correctionFactor, params) {
                this._x -= 0.003 * correctionFactor;
                
                if (this._y == 0 && Math.random() < 0.012)
                    params.velUp = 0.015;
                
                params.velUp += Game.Y_ACCELERATION_DOWN * correctionFactor;
                this._y += params.velUp;
                
                if (this._y <= 0) {
                    this.velUp = 0;
                    this._y = 0;
                }
                
                return params;
            },
            {velUp: 0});
        }
    },
    comet: {
        get: function() {
            return new Behavior(function(correctionFactor, params) {
                this._x -= 0.004 * correctionFactor;
                this._y += 0.002 * (this._x - 0.5)*2 * correctionFactor;
            });
        }
    }
})

BackgroundElement.elements = [
    () => { return new BackgroundElement('img/pa1.png', 'img/pa1N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pa2.png', 'img/pa2N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pc1.png', 'img/pc1N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pc2.png', 'img/pc2N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pr1.png', 'img/pr1N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pr2.png', 'img/pr2N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pv1.png', 'img/pv1N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/pv2.png', 'img/pv2N.png', 1, 0, 0, BackgroundElement.behaviors.building, 'building', 0.1) },
    () => { return new BackgroundElement('img/n1.png', 'img/n1N.png', 0, Math.random() * 0.2 + 0.7, 0, BackgroundElement.behaviors.cloud, ['clouds', 'sky'], 0.05) },
    () => { return new BackgroundElement('img/n2.png', 'img/n2N.png', 0, Math.random() * 0.2 + 0.7, 0, BackgroundElement.behaviors.cloud, ['clouds', 'sky'], 0.025) },
    () => { return new BackgroundElement('img/blob.png', 'img/blobN.png', 1, 0, 1, BackgroundElement.behaviors.blob, ['easteregg', 'blob'], 1) },
    () => { return new BackgroundElement('img/blob2.png', 'img/blob2N.png', 1, 0, 1, BackgroundElement.behaviors.blob, ['easteregg', 'blob'], 0.025) },
    () => { return new BackgroundElement('img/blob3.png', 'img/blob3N.png', 1, 0, 1, BackgroundElement.behaviors.blob, ['easteregg', 'blob'], 0.025) },
    () => { return new BackgroundElement('img/penes.png', 'img/penes.png', 1, Math.random() * 0.2 + 0.6, 2, BackgroundElement.behaviors.bird, 'easteregg', 0.001) },
    () => { return new BackgroundElement('img/mal.png', 
                                         'img/mal.png', 
                                         1, Math.random() * 0.15 + 0.4, 2, 
                                         BackgroundElement.behaviors.comet, 
                                         'easteregg', 0.01 * (GraphicsManager._dayPercentage > 0 ? 0 : 1)) }
];

BackgroundElement.createRandom = function() {
    return this.elements[Math.floor(Math.random() * this.elements.length)].clone();
}

Object.defineProperties(BackgroundElement.prototype, {
    x: {
        get: function() {
            return this._x;
        }
    },

    y: {
        get: function() {
            return this._y;
        }
    },
    
    z: {
        get: function() {
            return this._z;
        }
    },

    spawnChance: {
        get: function() {
            return this._spawnChance;
        }
    },

    groups: {
        get: function() {
            return this._groups;
        }
    }
});

BackgroundElement.prototype.tick = function(correctionFactor) {
    this._behavior.call(this, correctionFactor);
}

BackgroundElement.prototype.clone = function() {
    return new BackgroundElement(this.dayImg.src, 
                                 this.nightImg.src, 
                                 this._x, 
                                 this._y, 
                                 this._z, 
                                 this._behavior, 
                                 this._groups,
                                 this._spawnChance);
}

var BackgroundManager =  {
    ALPHA: 1,

    RANDOMIZE_CYCLE: 30, // em tickes
    
    MAX_ELEMENTS: 10,
    _elements: [],

    background: new GraphicElement('img/fundo.png', 'img/fundoN.png'),
    astro: new GraphicElement(Math.random() < 0.005 ? 'img/sergiaosol.png' : 'img/sol.png','img/lua.png'),

    paint: function(ctx, width, height, dayPercentage) {
        var astroPos = Math.min(dayPercentage, 1 - dayPercentage) * 2; // Posição do astro
        
        // FUNDO
        ctx.globalAlpha = 1;
        if (dayPercentage != 0) // Day
            ctx.drawImage(this.background.dayImg, 0, 0, width, height);
        
        ctx.globalAlpha = (1 - dayPercentage) * this.ALPHA;
        if (dayPercentage != 1) // Night            
            ctx.drawImage(this.background.nightImg, 0, 0, width, height);
        
        // ASTRO
        ctx.globalAlpha = 1;
        if (dayPercentage > 0.5)
            ctx.drawImage(this.astro.dayImg, 
                          (width - Server.constants.TUBE_WIDTH) * (1 - astroPos/3) - this.astro.dayImg.width/2, 
                          (height + this.astro.dayImg.height/2) * astroPos + 50) // Desenha o sol
        else 
            ctx.drawImage(this.astro.nightImg, 
                          (width - Server.constants.TUBE_WIDTH) * (1 - astroPos/3) - this.astro.nightImg.width/2, 
                          (height + this.astro.nightImg.height/2) * astroPos + 50) // Desenha a lua
        
        // DEMAIS ELEMENTOS
        this._elements.forEach((v) => {
            if (dayPercentage != 0) { // Day
                ctx.globalAlpha = 1;
                ctx.drawImage(v.dayImg,
                              (width + v.width) * v.x - v.width,
                              height * (1 - v.y) - v.height);
            }

            if (dayPercentage != 1) { // Night            
                ctx.globalAlpha = (1 - dayPercentage) * this.ALPHA;
                this._elements.forEach((v) => {
                    ctx.drawImage(v.nightImg,
                                  (width + v.width) * v.x - v.width,
                                  height * (1 - v.y) - v.height);
                });
            }
        });
        
        
    },

    tick: function(correctionFactor) {
        for (var i=0; i<this._elements.length; i++) {
            this._elements[i].tick(correctionFactor);
            if (this._elements[i].x < 0 || this._elements[i].x > 1 ||
                this._elements[i].y < 0 || this._elements[i].y > 1 ) { // Caso saiu da tela
                this._elements.splice(i, 1);
            }
        }
        
        if (++this.tick.count > this.RANDOMIZE_CYCLE)
        {
            this.tick.count %= this.RANDOMIZE_CYCLE;
            this._randomize();
        }
    },

    restart: function() {
        this._elements.length = 0; // Limpa o vetor de elementos
        this.tick.count = 0;
    },

    _randomize: function() {
        this._blocked.length = 0;
        if (this._elements.length < this.MAX_ELEMENTS) {
            for (let i=0; i<BackgroundElement.elements.length; i++) {
                var v = BackgroundElement.elements[i]();

                var includesGroup = false;
                for (let j=0; j<v.groups.length; j++)
                    if (this._blocked.includes(v.groups[j])) {
                        includesGroup = true;
                        break;
                    }

                if (!includesGroup && Math.random() < v.spawnChance) {
                    this._elements.splice(binaryFind(this._elements, v, function(a, b) {
                        return a.z - b.z;
                    }).index, 0, v.clone());

                    v.groups.forEach((v2) => {
                        this.block(v2); // Bloqueia o grupo de elementos para que ele nao seja spawnado
                    });
                }
            }
        }

        this._blocked.length = 0;
    },

    _blocked: [],

    block: function(group) {
        if (!this._blocked.includes(group))
            this._blocked.push(group);
    },

    allow: function(group) {
        var index = -1;
        for (let i=0; i<this._blocked.length; i++)
            if (this._blocked[i] == group) {
                index = i;
                break;
            }

        if (index >= 0)
            this._blocked.splice(index, 1);
    }
};
