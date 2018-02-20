function submitScore(data) {
    if (data.code === 'ok')
        UIManager.popup('Sucesso!', 'Pontuação enviada com sucesso!', 'success');
    else if (data.code == 'duplicate_name')
        UIManager.popup('Nome repetido', 'O nickname "'+data.info.nickname+'" já existe!', 'warning');
    else
        UIManager.popup('Erro', 'Erro interno de servidor. Tente novamente mais tarde...', 'error');
}