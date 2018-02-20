'use strict';

var ScoreboardLoader = {
    LOAD_AMT: 15,
    MAX_DISTANCE: 500, // px
    
    currIndex: 0,
    
    init: function() {
        window.onscroll = function(e) {
            if ((document.body.offsetHeight - window.innerHeight) - document.scrollingElement.scrollTop < ScoreboardLoader.MAX_DISTANCE)
                ScoreboardLoader.loadMore();
        };
        this.loadMore();
    },
    
    _alreadyLoading: [],
    
    loadMore: function() {
        if (!this._alreadyLoading.includes(this.currIndex)) {
            this._alreadyLoading.push(this.currIndex);
            $.ajax({
                url: 'server/getscore.php',
                data: {
                    from: this.currIndex,
                    to: this.currIndex + this.LOAD_AMT
                },
                method: 'GET',
                dataType: 'json',
                timeout: 3000,
                success: function(data) {
                    if (data.code == 'ok') {
                        data.info.forEach(function(elem) {
                            var tr = document.createElement('tr');
                            var r = document.createElement('td');
                            var n = document.createElement('td');
                            var s = document.createElement('td');
                            var img = document.createElement('img');

                            var appendImg = false;

                            switch (parseInt(elem.ranking)) {
                                case 1:
                                    tr.classList.add('first');
                                    img.src = 'img/medals/first.png';
                                    appendImg = true;
                                    break;
                                case 2:
                                    tr.classList.add('second');
                                    img.setAttribute('src', 'img/medals/second.png');
                                    appendImg = true;
                                    break;
                                case 3:
                                    tr.classList.add('third');
                                    img.setAttribute('src', 'img/medals/third.png');
                                    appendImg = true;
                                    break;
                            }
                            if (appendImg)
                                r.appendChild(img);
                            else
                                r.innerHTML += elem.ranking;
                            n.innerHTML = elem.nickname;
                            s.innerHTML = elem.score;
                            tr.appendChild(r);
                            tr.appendChild(n);
                            tr.appendChild(s);

                            document.getElementById('table').querySelector('tbody').appendChild(tr);                  
                        });

                        var a = ScoreboardLoader;
                        a.currIndex += a.LOAD_AMT + 1;
                        a._alreadyLoading.splice(a._alreadyLoading.findIndex(x => x == a.currIndex), 1);
                    }
                },
                fail: function(xhr) {
                    var a = ScoreboardLoader;
                    a._alreadyLoading.splice(a._alreadyLoading.findIndex(x => x == a.currIndex), 1);
                    Console.log('Erro de conexão. A resposta do servidor demorou muito.');
                }
            });
        }
    }
};

(() => {
    function loadfn(e) {
        ScoreboardLoader.init();
        window.removeEventListener('load', loadfn) // Remove o evento onload da janela
    }

    window.addEventListener('load', loadfn);
})();