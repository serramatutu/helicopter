// Títulos aleatórios :)
(() => {
    var titles = [
        'bronze programa mal :v (Bronze: rt)',
        'paga a pd',
        'hideki q fez as texturas',
        'pd terror',
        'valentezaum',
        '1337 h4cKr',
        'vem di sap',
        'zip zop',
        'vc nao vai ganhar',
        'FRODUNCIO',
        'brasil borbase',
        'para de jogar na aula',
        'ta no drive',
        'F O N',
        'desodorante de pepino',
        'black é prata',
        'Gimp God = hIdEkI',
        'tolete voador',
        'o bart é front-end',
        'GGGGGGGGGGG',
        'faz o 5s',
        'frodo = capiprata',
        'parana raposo',
        'fidelização do cliente'
    ];

    function loadfn() {
        var tag = document.createElement('title');
        var text = titles[Math.floor(Math.random() * titles.length)];
        tag.innerHTML = text;
        document.head.appendChild(tag);

        window.removeEventListener('load', loadfn);
    }
    window.addEventListener('load', loadfn);
})();
