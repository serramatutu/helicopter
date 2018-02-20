<?php
    session_start();
    require_once("Consts.php");

    if (!isset($_SESSION['score']) || $_SESSION['score'] <= 0) // Redireciona caso não seja válida a requisição
        echo json_encode(array('code' => 'err'));
    else {
        require_once("BD.php");
        
        try {
            $conn = connect();
            $stmt = $conn->prepare("EXEC sp_insertFlappyScore ?, ?");
            $stmt->execute(array($_POST['nickname'], $_SESSION['score']));
            $success = $stmt->rowCount();
        }
        catch (PDOException $e) {
            echo json_encode(array('code' => 'err'));
        }
        
        if ($success > 0)
            echo json_encode(array('code' => 'ok'));
        else
            echo json_encode(array(
                'code' => 'duplicate_name',
                'info' => array(
                    'nickname' => $_POST['nickname']
                )));
    }

    if (isset($_POST['invalidateScore']) && $_POST['invalidateScore'])
        $_SESSION['isScoreValid'] = false;
?>