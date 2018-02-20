'use strict';

var UIManager = {
    ANIMATION_DURATION: 750, // ms
    MAX_POPUP_TIME: 5000, // ms
    init: function() {
        var elems = document.getElementsByClassName('close');
        for (let i=0; i<elems.length; i++) {
            var a = i;
            elems[i].addEventListener('click', function() {
                document.getElementById(elems[a].getAttribute('data-target')).classList.add('hidden');
            });
        }
        
        var forms = document.getElementsByClassName('form');
        for (let i=0; i<forms.length; i++) {            
            var successCallback = null,
                callbackAttr = forms[i].getAttribute('data-success-callback');
            
            if (typeof window[callbackAttr] === 'function')
                successCallback = window[callbackAttr];
            
            forms[i].addEventListener('submit', function(e) {                
                $.ajax({
                    type: e.target.getAttribute('method'),
                    url: e.target.getAttribute('action'),
                    data: $(e.target).serialize(),
                    success: function(data) {
                        if (e.target.hasAttribute('data-target') && 
                            e.target.classList.contains('close-success') &&
                            e.target.getAttribute('data-close-code') == data.code)
                            document.getElementById(e.target.getAttribute('data-target')).classList.add('hidden');
                        
                        if (typeof successCallback === 'function')
                            successCallback(data);
                    },
                    fail: function(data) {
                        UIManager.popup('Erro', 'Erro ao enviar o formulário', 'error');
                    },
                    dataType: 'json'
                });
                e.preventDefault();
            });
        }
    },
    
    showSubmitModal: function() {
        InputManager.disableGroup('restart');
        document.getElementById('submitModal').classList.remove('hidden');
    },
    
    hideSubmitModal: function() {
        InputManager.enableGroup('restart');
        document.getElementById('submitModal').classList.add('hidden');
    },
    
    showFixedButtons: function() {
        Array.prototype.slice.call( // Converte de HTMLNodeList para Array
            document.getElementsByClassName('fixed-button')
        ).forEach(e => e.classList.remove('hidden'));
    },
    
    hideFixedButtons: function() {
        Array.prototype.slice.call( // Converte de HTMLNodeList para Array
            document.getElementsByClassName('fixed-button')
        ).forEach(e => e.classList.add('hidden'));
    },
    
    popup: function(title, msg, type) {
        var p = document.createElement('div');
        var t = document.createElement('div');
        var b = document.createElement('div');
        
        p.classList.add('popup');
        p.classList.add('animate'); // Para reativar a animação
        p.classList.add(type);
        t.classList.add('popup-title');
        t.innerHTML = title;
        b.classList.add('popup-body');
        b.innerHTML = msg;
        
        p.appendChild(t);
        p.appendChild(b);
        
        var container = document.getElementById('popupContainer');
        container.classList.add('moving');
        setTimeout(function() {
            container.prepend(p); 
            // Muita magia
            container.classList.remove('animate');
            container.classList.remove('moving');
            p.classList.add('animate');            
            
            setTimeout(function() {
                // Muita magia
                p.classList.remove('animate');
                p.classList.add('hide');
                void p.offsetWidth;
                p.classList.add('animate');
                
                setTimeout(function() {
                    container.removeChild(p);
                }, this.ANIMATION_DURATION);
            }.bind(this), this.MAX_POPUP_TIME - this.ANIMATION_DURATION)
        }.bind(this), this.ANIMATION_DURATION);
    }
}

//(() => {
//    function loadfn(e) {
//        UIManager.init();
//        window.removeEventListener('load', loadfn) // Remove o evento onload da janela
//    }
//
//    window.addEventListener('load', loadfn);
//})();

window.addEventListener('load', UIManager.init);