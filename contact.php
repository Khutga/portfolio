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

session_start();

function sendResponse($success, $message, $code = 200)
{
    http_response_code($code);
    echo json_encode(["success" => $success, "message" => $message]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

// --- reCAPTCHA DOĞRULAMA ---
$recaptcha_secret = RECAPTCHA_SECRET;
$recaptcha_token = isset($data->recaptcha_token) ? $data->recaptcha_token : '';

if (empty($recaptcha_token)) {
    sendResponse(false, "Security Token Missing.", 403);
}

$verify_url = "https://www.google.com/recaptcha/api/siteverify?secret={$recaptcha_secret}&response={$recaptcha_token}";
$verify_response = file_get_contents($verify_url);
$captcha_success = json_decode($verify_response);

if ($captcha_success->success == false || $captcha_success->score < 0.5) {
    sendResponse(false, "Security Alert: Bot Detected. Score: " . $captcha_success->score, 403);
}

// 1. Honeypot Check
if (!empty($data->_gotcha)) {
    sendResponse(true, "Packet Sent Successfully.");
}

// 2. Rate Limiting (60 seconds)
if (isset($_SESSION['last_submit_time']) && (time() - $_SESSION['last_submit_time'] < 60)) {
    sendResponse(false, "Traffic Jam. Please wait 1 minute.", 429);
}

$name = isset($data->name) ? htmlspecialchars(trim($data->name)) : '';
$email = isset($data->email) ? filter_var(trim($data->email), FILTER_SANITIZE_EMAIL) : '';
$message = isset($data->message) ? htmlspecialchars(trim($data->message)) : '';

if (empty($name) || empty($email) || empty($message)) {
    sendResponse(false, "Incomplete Data Packet.", 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, "Invalid Frequency (Email).", 400);
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

    $mail->setFrom(SMTP_USER, 'Portfolio Contact'); 
    $mail->addAddress('seyidzade62@gmail.com');
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = "PORTFOLIO: New Transmission from $name";

    $email_content = "
    <html>
    <body style='background-color:#000; color:#0f0; font-family:monospace; padding:20px;'>
        <h2 style='border-bottom:1px solid #0f0;'>INCOMING TRANSMISSION</h2>
        <p><strong>Source:</strong> $name</p>
        <p><strong>From:</strong> $email</p>
        <p><strong>Message:</strong><br>$message</p>
        <hr style='border-color:#0f0;'>
        <p style='font-size:10px;'>Sent from Portfolio seyidzade.sbs</p>
    </body>
    </html>
    ";

    $mail->Body = $email_content;
    $mail->AltBody = "Name: $name\nEmail: $email\nMessage: $message";
    
    $mail->send();

    $_SESSION['last_submit_time'] = time();
    sendResponse(true, "Transmission Successful.");

} catch (Exception $e) {
    sendResponse(false, "Server Link Failure. Code: 500", 500);
}
?>