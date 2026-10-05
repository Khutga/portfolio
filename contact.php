<?php

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'config.php';

header("Access-Control-Allow-Origin: https://seyidzade.sbs");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only POST is allowed (no GET scraping / probing).
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

session_start();

function sendResponse($success, $message, $code = 200)
{
    http_response_code($code);
    echo json_encode(["success" => $success, "message" => $message]);
    exit();
}

// Reject oversized bodies early (10 KB is plenty for name/email/message).
if (isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > 10240) {
    sendResponse(false, "Data packet too large.", 413);
}

$raw = file_get_contents("php://input");
if ($raw === false || $raw === '') {
    sendResponse(false, "Empty request.", 400);
}

$data = json_decode($raw);
if (json_last_error() !== JSON_ERROR_NONE || !is_object($data)) {
    sendResponse(false, "Invalid request format.", 400);
}

// 1. Honeypot first (cheap) — always return success so bots learn nothing.
if (!empty($data->_gotcha)) {
    sendResponse(true, "Packet Sent Successfully.");
}

// 2. IP-based rate limit (session cookies can be dropped by attackers).
// Allows max 5 sends/hour and min 60s gap per IP, stored in temp dir.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/portfolio_ratelimit_' . md5($ip) . '.json';
$now = time();
$rate = ['count' => 0, 'window_start' => $now, 'last' => 0];
if (is_file($rateFile)) {
    $saved = json_decode(@file_get_contents($rateFile), true);
    if (is_array($saved)) {
        $rate = array_merge($rate, $saved);
    }
}
if ($now - $rate['window_start'] > 3600) {
    $rate = ['count' => 0, 'window_start' => $now, 'last' => $rate['last']];
}
if (($now - $rate['last'] < 60) || $rate['count'] >= 5) {
    sendResponse(false, "Traffic Jam. Please wait before retrying.", 429);
}

// Session layer kept as a second signal.
if (isset($_SESSION['last_submit_time']) && ($now - $_SESSION['last_submit_time'] < 60)) {
    sendResponse(false, "Traffic Jam. Please wait before retrying.", 429);
}

$name = isset($data->name) ? trim((string)$data->name) : '';
$email = isset($data->email) ? trim((string)$data->email) : '';
$message = isset($data->message) ? trim((string)$data->message) : '';
$recaptcha_token = isset($data->recaptcha_token) ? (string)$data->recaptcha_token : '';

if ($name === '' || $email === '' || $message === '') {
    sendResponse(false, "Incomplete Data Packet.", 400);
}
if (mb_strlen($name) > 100 || mb_strlen($email) > 254 || mb_strlen($message) > 5000) {
    sendResponse(false, "Data packet too large.", 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, "Invalid Frequency (Email).", 400);
}
// Strip CR/LF to block mail header injection via name/email.
$safeName = preg_replace('/[\r\n]+/', ' ', $name);
$safeName = mb_substr($safeName, 0, 100);
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
// Escape for the HTML mail body.
$escName = htmlspecialchars($safeName, ENT_QUOTES, 'UTF-8');
$escEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$escMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

if ($recaptcha_token === '') {
    sendResponse(false, "Security check failed.", 403);
}

// --- reCAPTCHA verification (POST, 5s timeout, generic errors only) ---
$recaptcha_secret = RECAPTCHA_SECRET;
$verifyCtx = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query(['secret' => $recaptcha_secret, 'response' => $recaptcha_token, 'remoteip' => $ip]),
        'timeout' => 5,
        'ignore_errors' => true,
    ],
    'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
]);
$verify_response = @file_get_contents("https://www.google.com/recaptcha/api/siteverify", false, $verifyCtx);
if ($verify_response === false) {
    sendResponse(false, "Security check unavailable. Try again later.", 503);
}
$captcha = json_decode($verify_response);
if (!is_object($captcha) || empty($captcha->success) || !isset($captcha->score) || $captcha->score < 0.5) {
    sendResponse(false, "Security check failed.", 403);
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;

    $mail->SMTPAuth   = true;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 10;

    $mail->setFrom(SMTP_USER, 'Portfolio Contact');
    $mail->addAddress('seyidzade62@gmail.com');
    $mail->addReplyTo($email, $safeName);

    $mail->isHTML(true);
    $mail->Subject = "PORTFOLIO: New Transmission from $safeName";

    $email_content = "
    <html>
    <body style='background-color:#000; color:#0f0; font-family:monospace; padding:20px;'>
        <h2 style='border-bottom:1px solid #0f0;'>INCOMING TRANSMISSION</h2>
        <p><strong>Source:</strong> $escName</p>
        <p><strong>From:</strong> $escEmail</p>
        <p><strong>Message:</strong><br>$escMessage</p>
        <hr style='border-color:#0f0;'>
        <p style='font-size:10px;'>Sent from Portfolio seyidzade.sbs</p>
    </body>
    </html>
    ";

    $mail->Body = $email_content;
    $mail->AltBody = "Name: $safeName\nEmail: $email\nMessage: $message";

    $mail->send();

    // Record rate limit only on success.
    $rate['count']++;
    $rate['last'] = $now;
    @file_put_contents($rateFile, json_encode($rate), LOCK_EX);
    $_SESSION['last_submit_time'] = $now;
    sendResponse(true, "Transmission Successful.");

} catch (Exception $e) {
    sendResponse(false, "Server Link Failure. Try again later.", 500);
}
?>
