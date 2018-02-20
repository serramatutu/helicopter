'use strict';

// -------------------------------------- //
//           Handler Superclass           //
// -------------------------------------- //
function Handler(type, handleFunction, groups, id) {
    this.type = type;
    this.handleFunction = handleFunction;
    this._enabled = true;
    
    this.groups = groups || [];
    this.id = id || null;
}

Handler.prototype.disable = function() {
    this._enabled = false;
}

Handler.prototype.enable = function() {
    this._enabled = true;
}

Handler.prototype.isInGroup = function(group) {
    return this._groups.includes(group);
}

Object.defineProperties(Handler.prototype, {
    id: {
        get: function() {
            return this._id;
        },
        set: function(id) {
            if (typeof id !== 'string' && typeof id !== 'number' && id != null)
                throw new Error('Invalid ID for event handler');
            
            this._id = id;
        }
    },
    groups: {
        get: function() {
            return this._groups;
        },
        set: function(group) {
            if (typeof group !== 'number' && typeof group !== 'string' && !Array.isArray(group))
                throw new Error('Invalid group name for event handler');
            
            group = Array.isArray(group) ? group : [group];
            
            this._groups = group;
        }
    },
    
    handleFunction: {
        get: function() {
            return this._handleFunction;
        },
        
        set: function(f) {
            if (typeof f !== 'function')
                throw new Error('Handler must be function.');
            
            this._handleFunction = f;
        }
    },
    
    type: {
        get: function() {
            return this._type;
        },
        set: function(v) {
            if (!this.constructor.VALID_EVENT_TYPES.includes(v))
                throw new Error('Invalid event type '+v);
            
            this._type = v;
        }
    }
});
  





// -------------------------------------- //
//               Key Handler              //
// -------------------------------------- //
function KeyHandler(type, keys, handleFunction, groups, id) {
    Handler.call(this, type, handleFunction, groups, id);
    this.keys = keys;
}

KeyHandler.prototype = Object.create(Handler.prototype); // Herança de Handler
KeyHandler.prototype.constructor = KeyHandler;

KeyHandler.VALID_EVENT_TYPES = ['keydown', 'keypress', 'keyup'];

KeyHandler.prototype.handle = function(evt) {
    if (this._enabled && this.type == evt.type && 
        (this._keys.includes('any') || this._keys.includes(evt.key.toLowerCase())))
        this._handleFunction(evt);
};

Object.defineProperty(KeyHandler.prototype, 'keys', {
    get: function() {
        return this._keys;
    },

    set: function(keys) {
        if (typeof keys !== 'string' && !Array.isArray(keys))
            throw new Error('Key triggers for event handler must be of type string or array');
        
        keys = Array.isArray(keys) ? keys : [keys]
        
        for (var i=0; i<keys.length; i++)
            keys[i] = keys[i].toLowerCase();
        
        this._keys = keys;
    }    
});





// -------------------------------------- //
//              Mouse Handler             //
// -------------------------------------- //
function MouseHandler(type, handleFunction, groups, id) {
    Handler.call(this, type, handleFunction, groups, id);
}

MouseHandler.prototype = Object.create(Handler.prototype); // Herança de Handler
MouseHandler.prototype.constructor = MouseHandler;

MouseHandler.VALID_EVENT_TYPES = ['mousedown', 'mousepress', 'mouseup'];

MouseHandler.prototype.handle = function(evt) {
    if (this._enabled && this.type == evt.type)
        this._handleFunction(evt);
}
                        
       




// -------------------------------------- //
//               Input Manager            //
// -------------------------------------- //
var InputManager = {
    _handlers: [],
    
    _disabledGroups: [],
    
    addKeyHandler: function(type, keys, handleFunction, groups, id) {
        if (this._getIndexById(id) >= 0)
            throw new Error('Repeated ID');
        
        this._handlers.push(new KeyHandler(type, keys, handleFunction, groups, id));
    },
    
    addMouseHandler: function(type, handleFunction, groups, id) {
        if (this._getIndexById(id) >= 0)
            throw new Error('Repeated ID');
        
        this._handlers.push(new MouseHandler(type, handleFunction, groups, id));
    },
    
    removeHandler: function(id) {
        var index = this._getIndexById(id);
        
        if (index < 0)
            return false;
        
        this._handlers.splice(index, 1);
        return true;
    },
    
    removeHandlerGroup: function(group) {
        var indexes = this._getIndexesByGroupName(group);
        
        if (indexes.length < 0)
            return false;
        
        
        indexes.forEach((v) =>{
            this._handlers.splice(v, 1);
        });
        
        return true;
    },
      
    handleEvent: function(evt) {
        var found;
        for (let i=0; i<this._handlers.length; i++) {
            found = false;
            var groups = this._handlers[i].groups; // Percorre os grupos para ver se não estão desabilitados
            for (let j=0; j<groups.length; j++)
                if (!this.isGroupEnabled(groups[j])) {
                    found = true;
                    break;
                }
                    
            
            if (!found)
                this._handlers[i].handle(evt);
        }
            
    },
    
    enableHandler: function(id) {
        var index = this._getIndexById(id);
        
        if (index < 0)
            return false;
        
        this._handlers[i].enable();
    },
    
    disableHandler: function(id) {
        var index = this._getIndexById(id);
        
        if (index < 0)
            return false;
        
        this._handlers[i].disable();  
    },
    
    enableGroup: function(group) {
        var index = this._disabledGroups.indexOf(group);
        if (index >= 0)
            this._disabledGroups.splice(index, 1);
    },
    
    disableGroup: function(group) {
        if (!this._disabledGroups.includes(group))
            this._disabledGroups.push(group);
    },
    
    getHandler: function(id) {
        return this._handlers[this._getIndexById(id)];
    },
    
    getHandlersByGroupName: function(group) {
        var handlers = [];
        
        var indexes = this._getIndexesByGroupName(group);
        indexes.forEach((v) => {
            handlers.push(this._handlers[v]) ;
        });
        
        return handlers;
    },
    
    isGroupEnabled: function(group) {
        return !this._disabledGroups.includes(group);
    },
    
    _getIndexesByGroupName: function(group) {
        var indexes = [];
        for (var i=0; i<this._handlers.length; i++) {
            if (this._handlers[i].isInGroup(group)) {
                indexes.push(i);
            }
        }
        
        return indexes;
    },
    
    _getIndexById: function(id) {
        if (!id)
            return -1;
        
        var index = -1;
        
        for (var i=0; i<this._handlers.length; i++) {
            if (this._handlers[i].id == id && id != null) {
                index = i;
                break;
            }
        }
        
        return index;
    }
};

(() => {
    function loadfn(e) {
        function evtFunc(e) {
            InputManager.handleEvent(e);
        }

        window.addEventListener('keydown', evtFunc);
        window.addEventListener('keypress', evtFunc);
        window.addEventListener('keyup', evtFunc);
        window.addEventListener('mousedown', evtFunc);
        window.addEventListener('mouseup', evtFunc);
        
        window.removeEventListener('load', loadfn); // Remove o evento onload da janela
    }
    
    window.addEventListener('load', loadfn);
})();