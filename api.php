<?php
/**
 * ID Card Generator — REST API
 * Stores templates and employee records as JSON files on the server.
 * All devices accessing the same domain share this data.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-PIN');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Simple PIN protection ─────────────────────────────
$correctPIN = '1234';
$pin = isset($_SERVER['HTTP_X_PIN']) ? $_SERVER['HTTP_X_PIN'] : (isset($_GET['pin']) ? $_GET['pin'] : '');
if ($pin !== $correctPIN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Provide ?pin= or X-PIN header.']);
    exit;
}

// ── Data directory ────────────────────────────────────
$dataDir = __DIR__ . '/_data';
if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);

$type = isset($_GET['type']) ? preg_replace('/[^a-z]/', '', $_GET['type']) : '';
$method = $_SERVER['REQUEST_METHOD'];

// ── Helpers ──────────────────────────────────────────
function readFileJson($path) {
    if (!file_exists($path)) return [];
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function writeFileJson($path, $data) {
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// ── Templates ────────────────────────────────────────
$tplFile = $dataDir . '/templates.json';

if ($type === 'templates') {
    if ($method === 'GET') {
        echo json_encode(readFileJson($tplFile));
    }
    elseif ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body || !isset($body['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing template data']);
            exit;
        }
        $templates = readFileJson($tplFile);
        // Upsert
        $found = false;
        foreach ($templates as $i => $t) {
            if ($t['id'] === $body['id']) { $templates[$i] = $body; $found = true; break; }
        }
        if (!$found) array_unshift($templates, $body);
        if (count($templates) > 50) $templates = array_slice($templates, 0, 50);
        writeFileJson($tplFile, $templates);
        echo json_encode(['ok' => true, 'count' => count($templates)]);
    }
    elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? $_GET['id'] : '';
        $templates = readFileJson($tplFile);
        $templates = array_filter($templates, function($t) use ($id) { return $t['id'] !== $id; });
        writeFileJson($tplFile, array_values($templates));
        echo json_encode(['ok' => true]);
    }
}

// ── Employees ────────────────────────────────────────
$empFile = $dataDir . '/employees.json';

if ($type === 'employees') {
    if ($method === 'GET') {
        $employees = readFileJson($empFile);
        $search = isset($_GET['search']) ? mb_strtolower(trim($_GET['search'])) : '';
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

        if ($id > 0) {
            foreach ($employees as $e) {
                if ($e['id'] === $id) { echo json_encode($e); exit; }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            exit;
        }

        if ($search !== '') {
            $employees = array_filter($employees, function($e) use ($search) {
                return strpos(mb_strtolower($e['name'] ?? ''), $search) !== false
                    || strpos(mb_strtolower($e['empId'] ?? ''), $search) !== false
                    || strpos(mb_strtolower($e['department'] ?? ''), $search) !== false
                    || strpos(mb_strtolower($e['jobTitle'] ?? ''), $search) !== false;
            });
        }

        usort($employees, function($a, $b) {
            return strcmp($b['savedAt'] ?? '', $a['savedAt'] ?? '');
        });

        echo json_encode(array_values($employees));
    }
    elseif ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing employee data']);
            exit;
        }
        $employees = readFileJson($empFile);
        $maxId = 0;
        foreach ($employees as $e) { if (($e['id'] ?? 0) > $maxId) $maxId = $e['id']; }
        $body['id'] = $maxId + 1;
        $body['savedAt'] = date('c');
        array_unshift($employees, $body);
        if (count($employees) > 1000) $employees = array_slice($employees, 0, 1000);
        writeFileJson($empFile, $employees);
        echo json_encode(['ok' => true, 'id' => $body['id']]);
    }
    elseif ($method === 'DELETE') {
        $id = intval($_GET['id'] ?? 0);
        $employees = readFileJson($empFile);
        $employees = array_filter($employees, function($e) use ($id) { return ($e['id'] ?? 0) !== $id; });
        writeFileJson($empFile, array_values($employees));
        echo json_encode(['ok' => true]);
    }
}
