<?php

if (isset($_GET) && isset($_GET['from']) && isset($_GET['to'])) {
    require_once("BD.php");
    try {
        $conn = connect();
        $stmt = $conn->prepare("EXEC sp_selectScoreRange ?, ?");
        $stmt->execute(array($_GET['from'], $_GET['to']));
        echo json_encode(array(
            'code' => 'ok',
            'info' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ));
    }
    catch (PDOException $e) {
        echo json_encode(array('code' => 'err'));
    }
}

?>